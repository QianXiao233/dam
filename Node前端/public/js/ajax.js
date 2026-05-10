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
    xhr.open('GET', window.apiUrls.WATER_CTL_OPEN_URL, true);
    xhr.send();
    console.log("开启请求已发送");
    
    xhr.onerror = function() {
        console.error("❌ 开启请求失败");
    };
}

// 关闭请求
function turnOff() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', window.apiUrls.WATER_CTL_CLOSE_URL, true);
    xhr.send();
    console.log("关闭请求已发送");
    
    xhr.onerror = function() {
        console.error("❌ 关闭请求失败");
    };
}

// 自动水位控制
window.waterController = function() {
    try {
        var data = window.getData();
        if (!data || !data[0] || data[0].length === 0) {
            console.error('❌ getData 返回数据格式错误');
            return;
        }
        var value = data[0][0];
        // 核心逻辑：自动控制
        if (value >= 110 && !isRelayOn) {
            // 水位过高且继电器关闭 → 自动开启
            console.log("💧【自动控制】水位超过110，自动开启水闸 (水位:", value, ")");
            turnOn();
            isRelayOn = true;
            isManualOverride = false;  // 自动开启，清除手动优先标记
            lastAction = 'auto';
            updateUI();
            
        } else if (value < 110 && isRelayOn) {
            // 水位正常且继电器开启 → 需要判断是否能自动关闭
            if (isManualOverride) {
                // ⚠️ 重要：手动开启的水闸，自动不能关闭
                console.log("🚫【自动控制】水闸由手动开启，自动关闭被阻止！(水位:", value, ")");
            } else {
                // 自动开启的水闸，可以自动关闭
                console.log("💧【自动控制】水位低于110，自动关闭水闸 (水位:", value, ")");
                turnOff();
                isRelayOn = false;
                lastAction = 'auto';
                updateUI();
            }
        } else {
            console.log("✅【自动控制】水位正常，无需操作");
        }
        
    } catch (error) {
        console.error('❌ 自动控制执行失败:', error);
    }
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