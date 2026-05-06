"""
dam_brain.py - 智能大脑（WebSocket客户端 + HTTP版）
连接传感器WebSocket，接收JSON数组格式的水位数据
"""
import asyncio
import time
import json
import struct
import numpy as np
import torch
import torch.nn as nn
from collections import deque
import requests
import websockets

# ========== WebSocket配置 ==========
WS_URL = "ws://192.168.10.251:8085/websocket"

# ========== 闸门控制HTTP接口（改成实际地址）==========
GATE_OPEN_URL = "http://192.168.10.251:8085/RelayControl/Open"  # 改成实际地址
GATE_CLOSE_URL = "http://192.168.10.251:8085/RelayControl/Close"  # 改成实际地址

# ========== Ollama配置 ==========
OLLAMA_MODEL = "qwen2.5:0.5b"

# ========== 控制参数 ==========
HISTORY_LEN = 10
PLANNING_HORIZON = 12
NUM_CANDIDATES = 256

# ========== 在线学习参数 ==========
LEARN_EVERY_N_STEPS = 50
LEARN_EPOCHS = 5
LEARN_LR = 0.0001
MEMORY_SIZE = 500
LEARN_BATCH_SIZE = 64

# ========== 代价函数权重 ==========
COST_DEAD = 10000.0
COST_CRITICAL = 500.0
COST_LOW = 50.0
COST_WARNING = 80.0
COST_EMERGENCY = 200.0
COST_WASTE = 5.0
COST_SWITCH = 5.0

# ========== 水位参数 ==========
WATER_DEAD = 50
WATER_CRITICAL = 55
WATER_NORMAL_LOW = 45
WATER_NORMAL_HIGH = 80
WATER_WARNING = 80
WATER_WARNING_HIGH = 110
WATER_EMERGENCY = 110
WATER_MAX_VALID = 200

ADD_WATER_AT = 55
ADD_WATER_TO = 65
TARGET_WATER = 65


def parse_water_data(raw_data) -> int:
    """
    解析WebSocket发来的JSON数据，提取液位值
    Java格式: [[液位,浊度,震动,湿度,倾斜,泵状态],[预测值]]
    """
    try:
        # WebSocket消息是字符串
        if isinstance(raw_data, bytes):
            raw_data = raw_data.decode('utf-8')

        # 去掉首尾空格
        raw_data = raw_data.strip()

        # 解析JSON
        data = json.loads(raw_data)

        # 格式: [[106,2345,3456,4567,1,0],["预测值"]]
        sensor_array = data[0]  # 第一个数组是传感器数据

        # 液位是第一个元素
        water_level = int(sensor_array[0])

        return water_level

    except (json.JSONDecodeError, IndexError, ValueError, TypeError) as e:
        print(f"\n[⚠️] 数据解析失败: {e}, 原始数据: {raw_data[:100]}")
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


class WorldModel(nn.Module):
    def __init__(self, history_len=10, hidden_size=64, num_layers=2):
        super().__init__()
        self.lstm = nn.LSTM(input_size=2, hidden_size=hidden_size,
                            num_layers=num_layers, batch_first=True)
        self.output_head = nn.Sequential(
            nn.Linear(hidden_size, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, water_seq, action_seq):
        x = torch.stack([water_seq, action_seq.float()], dim=-1)
        lstm_out, _ = self.lstm(x)
        return self.output_head(lstm_out[:, -1, :])

    def predict_sequence(self, water_hist, action_hist, future_actions, steps):
        self.eval()
        preds = []
        cur_w = list(water_hist)
        cur_a = list(action_hist)
        with torch.no_grad():
            for i in range(steps):
                w = torch.FloatTensor([cur_w])
                a = torch.FloatTensor([cur_a])
                nw = self.forward(w, a).item()
                preds.append(nw)
                cur_w = cur_w[1:] + [nw]
                cur_a = cur_a[1:] + [future_actions[i]]
        return preds


class ExperienceMemory:
    def __init__(self, max_size=500):
        self.water_histories = deque(maxlen=max_size)
        self.action_histories = deque(maxlen=max_size)
        self.next_waters = deque(maxlen=max_size)
        self.prediction_errors = deque(maxlen=100)

    def add(self, water_history, action_history, next_water):
        self.water_histories.append(list(water_history))
        self.action_histories.append(list(action_history))
        self.next_waters.append(next_water)

    def add_error(self, predicted, actual):
        self.prediction_errors.append(abs(predicted - actual))

    def get_average_error(self):
        if len(self.prediction_errors) == 0:
            return 0
        return np.mean(self.prediction_errors)

    def size(self):
        return len(self.water_histories)

    def sample_batch(self, batch_size):
        if self.size() < batch_size:
            return None
        indices = np.random.choice(self.size(), batch_size, replace=False)
        batch_water = torch.FloatTensor([self.water_histories[i] for i in indices])
        batch_action = torch.FloatTensor([self.action_histories[i] for i in indices])
        batch_next = torch.FloatTensor([self.next_waters[i] for i in indices]).unsqueeze(1)
        return batch_water, batch_action, batch_next


class DamBrain:
    def __init__(self, model_path='world_model.pt'):
        ckpt = torch.load(model_path, weights_only=False)
        self.model = WorldModel(ckpt['history_len'], ckpt['hidden_size'], ckpt['num_layers'])
        self.model.load_state_dict(ckpt['model_state_dict'])
        self.water_mean = ckpt['water_mean']
        self.water_std = ckpt['water_std']

        self.memory = ExperienceMemory(max_size=MEMORY_SIZE)
        self.optimizer = torch.optim.Adam(self.model.parameters(), lr=LEARN_LR)
        self.criterion = nn.MSELoss()

        self.water_history = deque(maxlen=HISTORY_LEN)
        self.action_history = deque(maxlen=HISTORY_LEN)

        self.think_count = 0
        self.step_count = 0
        self.water_cycles = 0
        self.learn_count = 0
        self.last_prediction = None
        self.current_action = 0
        self.last_action = -1

    def send_action(self, action: int):
        if action == self.last_action:
            return
        url = GATE_OPEN_URL if action == 1 else GATE_CLOSE_URL
        try:
            requests.get(url, timeout=2)
            self.last_action = action
        except Exception as e:
            print(f"\n[⚠️] 闸门控制失败: {e}")

    def predict_future(self, action_seq):
        water_norm = [(w - self.water_mean) / self.water_std for w in self.water_history]
        preds_norm = self.model.predict_sequence(water_norm, list(self.action_history), action_seq, len(action_seq))
        return [p * self.water_std + self.water_mean for p in preds_norm]

    def predict_next(self):
        if len(self.water_history) < HISTORY_LEN:
            return None
        water_norm = [(w - self.water_mean) / self.water_std for w in self.water_history]
        self.model.eval()
        with torch.no_grad():
            w = torch.FloatTensor([water_norm])
            a = torch.FloatTensor([list(self.action_history)])
            pred = self.model(w, a).item()
        return pred * self.water_std + self.water_mean

    def compute_cost(self, predicted_waters, action_seq):
        total = 0.0
        for water in predicted_waters:
            if water <= WATER_DEAD:
                total += COST_DEAD
            elif water <= WATER_CRITICAL:
                total += COST_CRITICAL * ((WATER_CRITICAL - water) / (WATER_CRITICAL - WATER_DEAD)) ** 2
            elif water < WATER_NORMAL_LOW:
                total += COST_LOW * ((WATER_NORMAL_LOW - water) / (WATER_NORMAL_LOW - WATER_CRITICAL))
            elif water >= WATER_EMERGENCY:
                total += COST_EMERGENCY * ((water - WATER_EMERGENCY) / 30) ** 2
            elif water >= WATER_WARNING:
                total += COST_WARNING * ((water - WATER_WARNING) / (WATER_WARNING_HIGH - WATER_WARNING))

        total += COST_WASTE * sum(action_seq)
        switches = sum(1 for i in range(1, len(action_seq)) if action_seq[i] != action_seq[i-1])
        total += COST_SWITCH * switches
        return total

    def deep_think(self):
        if len(self.water_history) < HISTORY_LEN:
            return 0

        current = self.water_history[-1]

        if current >= 100:
            return 1

        self.think_count += 1

        candidates = []
        for _ in range(NUM_CANDIDATES):
            candidates.append(np.random.randint(0, 2, PLANNING_HORIZON).tolist())
        candidates.append([0] * PLANNING_HORIZON)

        best_seq = None
        best_cost = float('inf')

        for seq in candidates:
            pred = self.predict_future(seq)
            cost = self.compute_cost(pred, seq)
            if cost < best_cost:
                best_cost = cost
                best_seq = seq

        if self.think_count % 10 == 0:
            current = self.water_history[-1]
            final_pred = self.predict_future(best_seq)[-1]
            level = get_level_name(current)
            avg_error = self.memory.get_average_error()

            if len(self.water_history) >= 5:
                recent = list(self.water_history)[-5:]
                rate = (recent[-1] - recent[0]) / 5
            else:
                rate = 0

            print(f"\n🧠 思考#{self.think_count} | 水位:{current:.0f} {level} | 预测终点:{final_pred:.0f} | 代价:{best_cost:.2f}")
            print(f"   📊 误差:{avg_error:.2f} | 记忆:{self.memory.size()} | 已学:{self.learn_count}次")

            explanation = self.generate_explanation(current, level, best_seq[0], final_pred, best_cost, rate)
            print(f"   💬 {explanation}")

        return best_seq[0]

    def generate_explanation(self, water, level, action, prediction, cost, rate):
        action_text = "开闸放水" if action == 1 else "关闸省水"

        prompt = f"""你是水坝AI的翻译官。用一句通俗的话（30字内）解释这个决定：
水位{water}，{level}，变化速率{rate:.2f}/帧，预测未来{prediction}，选了{action_text}。
直接给出解释："""

        try:
            import ollama
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[{'role': 'user', 'content': prompt}],
                options={'temperature': 0.7, 'num_predict': 50}
            )
            return response['message']['content'].strip()
        except Exception:
            if action == 1 and rate > 1.0:
                return "水位涨得太快，提前开闸放水，防止撞警戒线。"
            elif action == 1 and water >= 110:
                return "应急水位，安全第一，必须开闸把水位降下来。"
            elif action == 1 and water >= 100:
                return "水位偏高，先开一会儿闸，降到安全范围就停。"
            elif action == 0 and level == "正常":
                return "水位在安全范围，关闸省水，不用动。"
            elif action == 0 and rate < 0:
                return "水位本来就在降，没必要开闸浪费水。"
            else:
                return "综合安全、省水和设备保护，这是最好的选择。"

    def online_learn(self):
        if self.memory.size() < LEARN_BATCH_SIZE:
            return

        self.learn_count += 1
        print(f"\n📚 [在线学习 #{self.learn_count}]")

        batch = self.memory.sample_batch(LEARN_BATCH_SIZE)
        if batch is None:
            return

        water_batch, action_batch, next_batch = batch
        water_norm = (water_batch - self.water_mean) / self.water_std
        next_norm = (next_batch - self.water_mean) / self.water_std

        self.model.train()
        for _ in range(LEARN_EPOCHS):
            self.optimizer.zero_grad()
            loss = self.criterion(self.model(water_norm, action_batch), next_norm)
            loss.backward()
            self.optimizer.step()
        self.model.eval()

        print(f"   ✅ 完成 | 误差:{self.memory.get_average_error():.2f}")

    async def run(self):
        print(f"\n{'='*50}")
        print(f"🧠 智能大脑启动（WebSocket客户端 + HTTP版）")
        print(f"   连接地址: {WS_URL}")
        print(f"   闸门控制: HTTP GET")
        print(f"   目标水位: {TARGET_WATER}")
        print(f"   解释模型: {OLLAMA_MODEL}")
        print(f"   数据格式: JSON数组 [[液位,...],[预测值]]")
        print(f"{'='*50}\n")

        print(f"\n💧 请加水至 {ADD_WATER_TO} 左右")
        print(f"   系统已就绪，等待连接传感器...\n")

        while True:
            try:
                print(f"[⏳] 正在连接传感器 {WS_URL} ...")
                async with websockets.connect(WS_URL) as websocket:
                    print(f"[✅] 已连接！等待水位数据...\n")

                    async for message in websocket:
                        water = parse_water_data(message)
                        if not is_valid_water(water):
                            continue

                        # 历史不够，先攒数据
                        if len(self.water_history) < HISTORY_LEN:
                            self.water_history.append(water)
                            self.action_history.append(0)
                            self.send_action(0)
                            self.last_action = 0
                            print(f"\r[初始化] 水位:{water} {get_level_name(water)} [{len(self.water_history)}/{HISTORY_LEN}]", end='', flush=True)
                            if len(self.water_history) == HISTORY_LEN:
                                print(f"\n✅ 初始化完成，起始水位: {water:.0f} {get_level_name(water)}")
                                print(f"⏳ 开始运行...\n")
                            continue

                        # 检查是否需要加水
                        if water <= ADD_WATER_AT:
                            self.water_cycles += 1
                            self.send_action(0)
                            self.last_action = 0

                            print(f"\n💧 [加水] 第{self.water_cycles}次 | 本箱运行{self.step_count}步")
                            print(f"   加水至 {ADD_WATER_TO}，按 Enter 继续...")
                            input()

                            self.water_history.clear()
                            self.action_history.clear()
                            self.step_count = 0
                            print(f"[✅] 请开始加水，系统继续监控...\n")
                            continue

                        # 记录预测误差
                        if self.last_prediction is not None:
                            self.memory.add_error(self.last_prediction, water)

                        # 存入经验库
                        if len(self.water_history) == HISTORY_LEN:
                            self.memory.add(self.water_history, self.action_history, water)

                        # 深度思考
                        action = self.deep_think()
                        self.current_action = action

                        # 发送命令
                        self.send_action(action)

                        # 更新历史
                        self.water_history.append(water)
                        self.action_history.append(action)
                        self.step_count += 1

                        # 预测下一秒
                        self.last_prediction = self.predict_next()

                        # 在线学习
                        if self.step_count % LEARN_EVERY_N_STEPS == 0 and self.step_count > 0:
                            self.online_learn()

                        # 实时显示
                        level = get_level_name(water)
                        act_str = "开🔓" if action == 1 else "关🔒"
                        err = self.memory.get_average_error()
                        print(f"\r[{time.strftime('%H:%M:%S')}] {act_str} | 水位:{water:.0f} {level} | 误差:{err:.2f} | 第{self.water_cycles}箱 | 步:{self.step_count}", end='', flush=True)

            except websockets.exceptions.ConnectionClosed:
                print(f"\n[⚠️] 连接断开，5秒后重连...")
                await asyncio.sleep(5)
            except Exception as e:
                print(f"\n[⚠️] 连接异常: {e}，5秒后重连...")
                await asyncio.sleep(5)


if __name__ == '__main__':
    brain = DamBrain(model_path='world_model.pt')
    try:
        asyncio.run(brain.run())
    except KeyboardInterrupt:
        print(f"\n\n⏹️ 停止")