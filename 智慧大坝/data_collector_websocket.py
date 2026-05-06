"""
data_collector.py - 数据采集器（WebSocket + HTTP版）
WebSocket接收水位数据，HTTP GET控制闸门开关
"""
import asyncio
import time
import random
import struct
import numpy as np
from collections import deque
import websockets
import requests

# ========== WebSocket配置 ==========
WS_HOST = '0.0.0.0'
WS_PORT = 8085

# ========== 闸门控制HTTP接口 ==========
GATE_OPEN_URL = "http://192.168.10.251:8082/RelayControl/Open"  # 改成实际地址
GATE_CLOSE_URL = "http://192.168.10.251:8082/RelayControl/Close"  # 改成实际地址

# ========== 采集参数 ==========
HISTORY_LENGTH = 10
COLLECT_SECONDS = 3600
SAVE_FILE = 'training_data.npy'
SAVE_INTERVAL = 300

# ========== 水位参数 ==========
WATER_DEAD = 50
WATER_CRITICAL = 55
WATER_NORMAL_LOW = 55
WATER_NORMAL_HIGH = 80
WATER_WARNING = 80
WATER_WARNING_HIGH = 110
WATER_EMERGENCY = 110
WATER_MAX_VALID = 200

ADD_WATER_AT = 55
ADD_WATER_TO = 65
INITIAL_FILL_TO = 65

RANDOM_FILL_MIN = 55
RANDOM_FILL_MAX = 140
RANDOM_FILL_WEIGHTS = {
    'normal': 0.4,
    'warning': 0.3,
    'emergency': 0.2,
    'high_warning': 0.1,
}


def parse_water_data(data: bytes) -> int:
    """解析水位数据帧，返回液位"""
    if isinstance(data, str):
        # 如果是字符串，尝试直接转数字
        try:
            return int(data)
        except:
            return None

    if isinstance(data, bytes):
        # 原来的帧格式
        if len(data) < 13 or data[0] != 0xAA or data[-1] != 0xBB:
            # 尝试直接转数字
            try:
                return int(data.decode())
            except:
                return None
        return struct.unpack('>H', data[4:6])[0]

    return None


def is_valid_water(water: int) -> bool:
    if water is None:
        return False
    if water < 0 or water > WATER_MAX_VALID:
        return False
    return True


def get_level_name(water: int) -> str:
    if water <= WATER_DEAD:
        return "死水位⚫"
    elif water <= WATER_CRITICAL:
        return "濒死🔴"
    elif water <= WATER_NORMAL_HIGH:
        return "正常🟢"
    elif water <= WATER_WARNING_HIGH:
        return "预警🟡"
    else:
        return "应急🟠"


def get_prob_open(water: int) -> float:
    if water <= WATER_CRITICAL:
        return 0.0
    elif water <= 50:
        return 0.05
    elif water <= 60:
        return 0.15
    elif water <= 70:
        return 0.4
    elif water <= 80:
        return 0.6
    elif water <= WATER_WARNING_HIGH:
        return 0.85
    else:
        return 1.0


def random_fill_target() -> int:
    zones = list(RANDOM_FILL_WEIGHTS.keys())
    weights = list(RANDOM_FILL_WEIGHTS.values())
    chosen_zone = random.choices(zones, weights=weights, k=1)[0]
    if chosen_zone == 'normal':
        return random.randint(55, 80)
    elif chosen_zone == 'warning':
        return random.randint(80, 110)
    elif chosen_zone == 'emergency':
        return random.randint(110, 140)
    elif chosen_zone == 'high_warning':
        return random.randint(75, 80)
    return ADD_WATER_TO


class DataCollector:
    def __init__(self):
        self.water_history = deque(maxlen=HISTORY_LENGTH)
        self.action_history = deque(maxlen=HISTORY_LENGTH)
        self.training_data = []
        self.current_action = 0
        self.frame_count = 0
        self.add_water_count = 0
        self.abnormal_count = 0
        self.last_save_time = 0
        self.current_round = 0
        self.paused = False  # 加水时暂停
        self.latest_water = None  # 最新水位
        self.zone_samples = {
            '濒死': 0,
            '正常偏低': 0,
            '正常偏高': 0,
            '预警': 0,
            '应急': 0
        }

    def send_action(self, action: int):
        """通过HTTP GET控制闸门"""
        url = GATE_OPEN_URL if action == 1 else GATE_CLOSE_URL
        try:
            requests.get(url, timeout=2)
        except Exception as e:
            print(f"\n[⚠️] 闸门控制请求失败: {e}")

    def save_data(self):
        np.save(SAVE_FILE, self.training_data)
        self.last_save_time = time.time()

    def record_sample(self, water: int):
        if len(self.water_history) == HISTORY_LENGTH:
            self.training_data.append({
                'water_history': list(self.water_history),
                'action_history': list(self.action_history),
                'next_water': water
            })
            self.update_zone_stats(water)

    def update_zone_stats(self, water: int):
        if water <= WATER_CRITICAL:
            self.zone_samples['濒死'] += 1
        elif water <= 65:
            self.zone_samples['正常偏低'] += 1
        elif water <= WATER_NORMAL_HIGH:
            self.zone_samples['正常偏高'] += 1
        elif water <= WATER_WARNING_HIGH:
            self.zone_samples['预警'] += 1
        else:
            self.zone_samples['应急'] += 1

    def update_history(self, water: int):
        self.water_history.append(water)
        self.action_history.append(self.current_action)

    def choose_action(self):
        if len(self.water_history) == 0:
            self.current_action = 0
            return
        current = self.water_history[-1]
        prob = get_prob_open(current)
        old_action = self.current_action
        self.current_action = 1 if random.random() < prob else 0
        if self.current_action != old_action:
            self.send_action(self.current_action)

    def print_status(self, water: int, extra=""):
        level = get_level_name(water)
        act = "开🔓" if self.current_action == 1 else "关🔒"
        total = max(len(self.training_data), 1)
        parts = [f"{z}:{c / total * 100:.0f}%" for z, c in self.zone_samples.items()]
        coverage = "|".join(parts)
        print(
            f"\r[帧{self.frame_count:6d}] 水位:{water:4d} {level} | 闸门:{act} | 样本:{len(self.training_data):6d} | {coverage}{extra}",
            end='', flush=True)

    def handle_add_water(self, current_water=None):
        self.send_action(0)
        self.current_action = 0
        self.paused = True
        target = random_fill_target()
        self.current_round += 1

        self.save_data()

        print(f"\n")
        print(f"{'─' * 50}")
        print(f"💧 [第{self.current_round}轮加水]")
        print(f"   当前水位: {current_water}")
        print(f"   🎯 本轮加水目标: {target}")
        print(f"   目标区间: [{get_level_name(target)}]")
        print(f"   死水位: {WATER_DEAD} | 濒死线: {WATER_CRITICAL}")
        print(f"   💾 数据已保存（{len(self.training_data)}条样本）")
        print(f"{'─' * 50}")

        while True:
            cmd = input("\n按 Enter 查看水位，输入 ok 继续训练: ").strip().lower()
            if cmd == 'ok':
                break
            if self.latest_water is not None:
                level_name = get_level_name(self.latest_water)
                diff = self.latest_water - target
                print(f"   📊 水位: {self.latest_water:4d} [{level_name}] | 距目标: {diff:+d}")
                if abs(diff) <= 5:
                    print(f"   ✅ 已达到目标水位")
                elif diff < 0:
                    print(f"   ⬆️  还需加水 {abs(diff)}")
                else:
                    print(f"   ⬇️  加多了 {diff}")
            else:
                print(f"   ❌ 暂无水位数据")

        print(f"\n[重新初始化] 清空历史缓冲区...")
        self.water_history.clear()
        self.action_history.clear()
        self.paused = False
        print(f"   ✅ 第{self.current_round}轮开始\n")

    async def handle_ws_message(self, websocket, path):
        """处理WebSocket消息"""
        try:
            async for message in websocket:
                self.frame_count += 1

                # 解析水位数据
                if isinstance(message, bytes):
                    water = parse_water_data(message)
                else:
                    water = parse_water_data(message)

                if not is_valid_water(water):
                    self.abnormal_count += 1
                    continue

                self.latest_water = water

                if self.paused:
                    continue  # 加水暂停期间不采集

                # 检查是否需要加水
                if water <= ADD_WATER_AT:
                    self.add_water_count += 1
                    self.handle_add_water(water)
                    continue

                # 记录样本
                self.record_sample(water)
                self.update_history(water)

                # 选择动作
                self.choose_action()

                # 定时保存
                extra = ""
                if time.time() - self.last_save_time >= SAVE_INTERVAL:
                    self.save_data()
                    extra = " | 💾已保存"

                self.print_status(water, extra)

        except websockets.exceptions.ConnectionClosed:
            print(f"\n[⚠️] WebSocket连接断开")

    async def run_ws_server(self):
        """启动WebSocket服务器"""
        print(f"\n{'=' * 60}")
        print(f"📊 数据采集器启动（WebSocket + HTTP版）")
        print(f"   WebSocket监听: ws://0.0.0.0:{WS_PORT}")
        print(f"   闸门控制: HTTP GET")
        print(f"   采集时长: {COLLECT_SECONDS}秒 | 自动保存: 每{SAVE_INTERVAL}秒")
        print(f"{'=' * 60}\n")

        print(f"\n💧 请先加水至 {INITIAL_FILL_TO} 左右，按 Enter 开始...")
        input()

        print(f"[⏳] 等待WebSocket连接...")

        self.last_save_time = time.time()
        start_time = time.time()

        # 启动WebSocket服务器
        async with websockets.serve(self.handle_ws_message, WS_HOST, WS_PORT):
            print(f"[✅] WebSocket服务器已启动，等待数据...")
            print(f"⏳ 开始采集（实时显示，Ctrl+C 停止）...\n")

            try:
                # 等待采集时长
                while time.time() - start_time < COLLECT_SECONDS:
                    await asyncio.sleep(1)
            except KeyboardInterrupt:
                print(f"\n\n⏹️ 用户中断")

        elapsed = time.time() - start_time
        self.save_data()
        self.send_action(0)

        print(f"\n{'=' * 60}")
        print(f"✅ 采集完成！")
        print(f"   时长: {elapsed:.0f}秒 | 帧数: {self.frame_count}")
        print(f"   样本: {len(self.training_data)} | 异常: {self.abnormal_count}")
        print(f"   加水: {self.add_water_count}轮")
        print(f"💾 最终保存至 {SAVE_FILE}")
        print(f"{'=' * 60}")

    def run(self):
        """入口"""
        asyncio.run(self.run_ws_server())


if __name__ == '__main__':
    collector = DataCollector()
    collector.run()