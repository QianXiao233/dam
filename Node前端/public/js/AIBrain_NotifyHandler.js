let canShowPumpNotify = true;
let pumpNotifyInterval = 3000;

async function checkPumpNotify() {
    if (!canShowPumpNotify) return;
    
    try {
        const countResponse = await fetch(window.apiUrls.java_url + "/get_messagecount", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        
        if (!countResponse.ok) {
            throw new Error(`HTTP ${countResponse.status}`);
        }
        
        const messageCount = await countResponse.json();
        
        if (messageCount > 0) {
            console.log(`发现 ${messageCount} 条消息，正在获取...`);
            
            const messageResponse = await fetch(window.apiUrls.java_url + "/get_message", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            
            if (!messageResponse.ok) {
                throw new Error(`HTTP ${messageResponse.status}`);
            }
            
            const result = await messageResponse.json();
            
            if (result && result.type === "PumpNotify") {
                handlePumpNotify(result);
            }
        }
        
        pumpNotifyInterval = 3000;
        
    } catch (error) {
        console.error('PumpNotify请求失败:', error);
        pumpNotifyInterval = Math.min(pumpNotifyInterval * 1.5, 10000);
        console.log(`下次轮询将在 ${pumpNotifyInterval/1000} 秒后`);
    }
}

function handlePumpNotify(message) {
    if (!canShowPumpNotify) return;
    
    canShowPumpNotify = false;
    
    const { id, content } = message;
    
    // 显示新弹窗卡片
    shownotice(content);
    
    // 保存消息ID，供确认/拒绝时删除
    window.currentPumpNotifyId = id;
}

// 重写确认开闸函数
window.confirmOpen = async function() {
    try {
        const response = await fetch('http://192.168.10.247:5001/confirm_open', {
            method: 'GET',
        });
        const data = await response.json();
        console.log('确认开闸结果:', data);
        
        // 删除消息
        if (window.currentPumpNotifyId) {
            await delete_message(window.currentPumpNotifyId);
            window.currentPumpNotifyId = null;
        }
        
        // 隐藏弹窗
        hidenotice();
        canShowPumpNotify = true;
        
    } catch (error) {
        console.error('确认开闸失败:', error);
    }
}

// 重写拒绝开闸函数
window.rejectOpen = async function() {
    try {
        const response = await fetch('http://192.168.10.247:5001/reject_open', {
            method: 'GET',
        });
        const data = await response.json();
        console.log('拒绝开闸结果:', data);
        
        // 删除消息
        if (window.currentPumpNotifyId) {
            await delete_message(window.currentPumpNotifyId);
            window.currentPumpNotifyId = null;
        }
        
        // 隐藏弹窗
        hidenotice();
        canShowPumpNotify = true;
        
    } catch (error) {
        console.error('拒绝开闸失败:', error);
    }
}

async function delete_message(mid) {
    if (!mid) return;
    
    try {
        const response = await fetch(window.apiUrls.java_url + "/delete_message", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${encodeURIComponent(mid)}`
        });
        
        if (response.ok) {
            console.log('消息已删除并处理完成');
        }
    } catch (error) {
        console.error('删除失败:', error);
    }
}

// 动态调整轮询间隔
function startPumpNotifyPolling() {
    setInterval(async () => {
        await checkPumpNotify();
    }, pumpNotifyInterval);
}

// 启动轮询
startPumpNotifyPolling();