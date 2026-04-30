"""
data_collector.py - 数据采集器（全水位覆盖版）
随机加水目标，覆盖45-120全区间
"""
import socket
import time
import random
import struct
import numpy as np
from collections import deque

# ========== 服务端配置 ==========
LISTEN_HOST = '0.0.0.0'
LISTEN_PORT = 8082

# ========== 采集参数 ==========
HISTORY_LENGTH = 10
COLLECT_SECONDS = 3600
SAVE_FILE = 'training_data.npy'
SAVE_INTERVAL = 300

# ========== 水位参数 ==========
WATER_DEAD = 50
WATER_CRITICAL = 55
WATER_NORMAL_LOW = 45
WATER_NORMAL_HIGH = 80
WATER_WARNING = 80
WATER_WARNING_HIGH = 110
WATER_EMERGENCY = 110
WATER_MAX_VALID = 200
WATER_OVERFLOW = 160      # 漫坝危险，绝对不要加到这么高

ADD_WATER_AT = 55          # 触发加水
ADD_WATER_TO = 65          # 默认加水目标（正常中间）
INITIAL_FILL_TO = 65

# 随机加水参数
RANDOM_FILL_MIN = 55       # 随机加水最低值（刚好脱离濒死）
RANDOM_FILL_MAX = 140      # 随机加水最高值（应急区间，充分覆盖）
RANDOM_FILL_WEIGHTS = {    # 各区间的采样权重
    'normal': 0.4,         # 40%概率加水到正常区间(55-80)
    'warning': 0.3,        # 30%概率加水到预警区间(80-110)
    'emergency': 0.2,      # 20%概率加水到应急区间(110-120)
    'high_warning': 0.1,   # 10%概率加水到正常偏高(75-80)
}

# ========== 通信帧 ==========
FRAME_OPEN  = bytes.fromhex('AA11010101DBBB')
FRAME_CLOSE = bytes.fromhex('AA11010100DBBB')


def parse_sensor_frame(data: bytes) -> int:
    if len(data) < 13 or data[0] != 0xAA or data[-1] != 0xBB:
        return None
    return struct.unpack('>H', data[4:6])[0]*2



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
    """
    随机生成加水目标，覆盖全水位区间
    返回要加到的目标水位值
    """
    # 按权重随机选择区间
    zones = list(RANDOM_FILL_WEIGHTS.keys())
    weights = list(RANDOM_FILL_WEIGHTS.values())
    chosen_zone = random.choices(zones, weights=weights, k=1)[0]

    if chosen_zone == 'normal':
        return random.randint(55, 80)
    elif chosen_zone == 'warning':
        return random.randint(80, 110)
    elif chosen_zone == 'emergency':
        return random.randint(110, 120)
    elif chosen_zone == 'high_warning':
        return random.randint(75, 80)
    return ADD_WATER_TO  # 兜底


class DataCollector:
    def __init__(self):
        self.server_sock = None
        self.conn = None
        self.water_history = deque(maxlen=HISTORY_LENGTH)
        self.action_history = deque(maxlen=HISTORY_LENGTH)
        self.training_data = []
        self.current_action = 0
        self.frame_count = 0
        self.add_water_count = 0
        self.abnormal_count = 0
        self.last_save_time = 0
        self.current_round = 0
        self.round_stats = []      # 每轮加水记录
        # 统计各区间已采集的样本数
        self.zone_samples = {
            '濒死': 0,
            '正常偏低': 0,
            '正常偏高': 0,
            '预警': 0,
            '应急': 0
        }

    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "无法获取"

    def wait_for_connection(self):
        self.server_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.server_sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server_sock.bind((LISTEN_HOST, LISTEN_PORT))
        self.server_sock.listen(1)
        print(f"[⏳] 等待传感器连接... 本机: {self.get_local_ip()}:{LISTEN_PORT}")
        self.conn, addr = self.server_sock.accept()
        self.conn.settimeout(3.0)
        print(f"[✅] 传感器已连接！来自: {addr[0]}:{addr[1]}")

    def read_water(self) -> int:
        try:
            data = self.conn.recv(1024)
            if not data or len(data) == 0:
                return None
            self.frame_count += 1
            water = parse_sensor_frame(data)
            if not is_valid_water(water):
                self.abnormal_count += 1
                return None
            return water
        except socket.timeout:
            return None
        except (ConnectionResetError, BrokenPipeError, OSError):
            return None

    def send_action(self, action: int):
        try:
            if action == 1:
                self.conn.send(FRAME_OPEN)
            else:
                self.conn.send(FRAME_CLOSE)
        except Exception:
            pass

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
            # 统计区间
            self.update_zone_stats(water)

    def update_zone_stats(self, water: int):
        """更新各区间样本统计"""
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
        print(f"\r[帧{self.frame_count:6d}] 水位:{water:4d} {level} | 闸门:{act} | 样本:{len(self.training_data):6d} | 整区:{self.get_zone_coverage()}{extra}", end='', flush=True)

    def get_zone_coverage(self) -> str:
        """获取各区间样本覆盖情况"""
        total = max(len(self.training_data), 1)
        parts = []
        for zone, count in self.zone_samples.items():
            pct = count / total * 100
            parts.append(f"{zone}:{pct:.0f}%")
        return "|".join(parts)

    def handle_add_water(self, current_water=None):
        self.send_action(0)
        self.current_action = 0

        # 生成本轮加水目标
        target = random_fill_target()
        self.current_round += 1

        # 加水前保存
        self.save_data()

        print(f"\n")
        print(f"{'─'*50}")
        print(f"💧 [第{self.current_round}轮加水]")
        print(f"   当前水位: {current_water}")
        print(f"   🎯 本轮加水目标: {target}")
        level = get_level_name(target)
        print(f"   目标区间: [{level}]")
        print(f"   正常范围: {WATER_NORMAL_LOW}-{WATER_NORMAL_HIGH}")
        print(f"   死水位: {WATER_DEAD} | 濒死线: {WATER_CRITICAL}")
        print(f"   ⚠️  请加水到目标值附近，不要超过{WATER_OVERFLOW}")
        print(f"   💾 数据已保存（{len(self.training_data)}条样本）")
        print(f"   📊 区间覆盖: {self.get_zone_coverage()}")
        print(f"{'─'*50}")

        while True:
            cmd = input("\n按 Enter 查看水位，输入 ok 继续训练: ").strip().lower()
            if cmd == 'ok':
                break

            print("   读取中...")
            for _ in range(3):
                water = self.read_water()
                if water is not None and is_valid_water(water):
                    level_name = get_level_name(water)
                    diff = water - target
                    print(f"   📊 水位: {water:4d} [{level_name}] | 距目标: {diff:+d}")
                    if water <= WATER_DEAD:
                        print(f"   ⛔ 死水位以下！立即加水！")
                    elif water <= WATER_CRITICAL:
                        print(f"   🚨 濒死！还需加水！")
                    elif abs(diff) <= 5:
                        print(f"   ✅ 已达到目标水位")
                    elif diff < 0:
                        print(f"   ⬆️  还需加水 {abs(diff)}")
                    else:
                        print(f"   ⬇️  加多了 {diff}")
                    break
                time.sleep(0.2)
            else:
                print(f"   ❌ 未收到有效数据")

        # 重新初始化
        print(f"\n[重新初始化] 清空历史缓冲区...")
        self.water_history.clear()
        self.action_history.clear()

        for i in range(HISTORY_LENGTH):
            water = self.read_water()
            if water is not None and is_valid_water(water):
                self.update_history(water)
                self.send_action(0)
                level_name = get_level_name(water)
                print(f"   [{i+1}/{HISTORY_LENGTH}] 水位: {water} [{level_name}]")

        print(f"   ✅ 第{self.current_round}轮开始\n")

    def init_history(self):
        print("[初始化] 填充历史数据...")
        count = 0
        max_attempts = 200

        while count < HISTORY_LENGTH and max_attempts > 0:
            water = self.read_water()
            max_attempts -= 1

            if water is None:
                continue

            if not is_valid_water(water):
                print(f"   [异常: {water}] 已丢弃")
                continue

            level_name = get_level_name(water)
            print(f"   [{count+1}/{HISTORY_LENGTH}] 水位: {water:4d} [{level_name}]")

            if water <= WATER_CRITICAL:
                print(f"   ⚠️  濒死水位！需要先加水")
                self.handle_add_water(water)
                count = 0
                continue

            self.update_history(water)
            self.send_action(0)
            count += 1

        return count == HISTORY_LENGTH

    def run(self):
        print(f"\n{'='*60}")
        print(f"📊 数据采集器启动（全水位覆盖版）")
        print(f"   本机: {self.get_local_ip()}:{LISTEN_PORT}")
        print(f"   采集时长: {COLLECT_SECONDS}秒 | 自动保存: 每{SAVE_INTERVAL}秒")
        print(f"   水位体系:")
        print(f"     死: 0-{WATER_DEAD} | 濒: {WATER_DEAD}-{WATER_CRITICAL}")
        print(f"     正常: {WATER_NORMAL_LOW}-{WATER_NORMAL_HIGH}")
        print(f"     预警: {WATER_WARNING}-{WATER_WARNING_HIGH}")
        print(f"     应急: {WATER_EMERGENCY}+ | 异常: >{WATER_MAX_VALID}")
        print(f"   随机加水范围: {RANDOM_FILL_MIN}-{RANDOM_FILL_MAX}")
        print(f"   区间权重: 正常40% | 预警30% | 应急20% | 正常偏高10%")
        print(f"   🎯 每轮加水目标随机变化，覆盖全水位区间")
        print(f"{'='*60}\n")

        self.wait_for_connection()

        print(f"\n💧 请先加水至 {INITIAL_FILL_TO} 左右")
        input("   按 Enter 开始...")

        if not self.init_history():
            print("❌ 初始化失败")
            self.conn.close()
            self.server_sock.close()
            return

        print(f"\n✅ 初始化完成，起始水位: {self.water_history[-1]}")
        print(f"⏳ 开始采集（实时显示，Ctrl+C 停止）...\n")

        self.last_save_time = time.time()
        start_time = time.time()

        try:
            while time.time() - start_time < COLLECT_SECONDS:
                water = self.read_water()

                if water is None:
                    continue

                if water <= ADD_WATER_AT:
                    self.add_water_count += 1
                    self.handle_add_water(water)
                    continue

                self.record_sample(water)
                self.update_history(water)
                self.choose_action()

                extra = ""
                if time.time() - self.last_save_time >= SAVE_INTERVAL:
                    self.save_data()
                    extra = " | 💾已保存"

                self.print_status(water, extra)

        except KeyboardInterrupt:
            print(f"\n\n⏹️ 用户中断")

        elapsed = time.time() - start_time

        self.save_data()

        print(f"\n{'='*60}")
        print(f"✅ 采集完成！")
        print(f"   时长: {elapsed:.0f}秒 | 帧数: {self.frame_count}")
        print(f"   样本: {len(self.training_data)} | 异常: {self.abnormal_count}")
        print(f"   加水: {self.add_water_count}轮 | 频率: {self.frame_count/max(elapsed,1):.1f}帧/秒")
        print(f"   区间覆盖: {self.get_zone_coverage()}")
        print(f"💾 最终保存至 {SAVE_FILE}")
        print(f"{'='*60}")

        self.send_action(0)
        self.conn.close()
        self.server_sock.close()


if __name__ == '__main__':
    collector = DataCollector()
    collector.run()