// 状态变量
var isRelayOn = false;        // 继电器当前状态
var isManualOverride = false;  // 是否手动覆盖（true=手动开启，自动不能关；false=自动开启，手动能关）
var lastAction = null;         // 记录最后一次操作类型（'manual' 或 'auto'）

// 更新界面显示
function updateUI() {
    var statusText = isRelayOn ? "开启" : "关闭";
    var infoElement = document.getElementById('information');
    if (infoElement) {
        infoElement.innerHTML = "(状态：" + statusText + ")";
    }
    
    // 更新模式提示
    var modeElement = document.getElementById('modeStatus');
    if (modeElement) {
        if (isManualOverride) {
            modeElement.innerHTML = "⚠️ 手动优先模式：水闸由手动控制，自动功能不会关闭";
            modeElement.style.color = "orange";
            modeElement.style.backgroundColor = "#fff3e0";
        } else if (isRelayOn && lastAction === 'auto') {
            modeElement.innerHTML = "🤖 自动开启模式：可以手动关闭";
            modeElement.style.color = "green";
            modeElement.style.backgroundColor = "#e8f5e9";
        } else {
            modeElement.innerHTML = "✅ 正常模式：自动控制运行中";
            modeElement.style.color = "#666";
            modeElement.style.backgroundColor = "#f5f5f5";
        }
    }
}

// 手动切换继电器
function manualToggle() {
    if (isRelayOn) {
        // 手动关闭：允许关闭，无论什么状态
        console.log("手动关闭水闸");
        turnOff();
        isRelayOn = false;
        isManualOverride = false;  // 关闭后清除手动优先标记
        lastAction = 'manual';
    } else {
        // 手动开启
        console.log("手动开启水闸");
        turnOn();
        isRelayOn = true;
        isManualOverride = true;   // 设置手动优先标记，自动不能关闭
        lastAction = 'manual';
    }
    
    updateUI();
}

// 开启请求
function turnOn() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "http://192.168.10.251:8085/RelayControl/Open", true);
    xhr.send();
    console.log("开启请求已发送");
    
    xhr.onerror = function() {
        console.error("❌ 开启请求失败");
    };
}

// 关闭请求
function turnOff() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', "http://192.168.10.251:8085/RelayControl/Close", true);
    xhr.send();
    console.log("关闭请求已发送");
    
    xhr.onerror = function() {
        console.error("❌ 关闭请求失败");
    };
}

// 自动水位控制（已禁用自动开闸，仅保留手动控制）
window.waterController = function() {
    // 功能已屏蔽 —— 不再根据水位自动开闸/关闸
    // 仅保留手动按钮控制逻辑
}
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 绑定手动按钮事件
    var btn = document.getElementById('myButton');
    if (btn) {
        btn.addEventListener('click', function() {
            manualToggle();
        });
    // 初始化界面显示
    updateUI();
}})