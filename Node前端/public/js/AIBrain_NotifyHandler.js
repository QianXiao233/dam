let canShowPumpNotify = true;
let pumpNotifyInterval = 3000;
let pendingPumpMessage = null;  // 存储待确认的消息
let isConfirming = false;       // 是否处于二次确认状态

async function checkPumpNotify() {
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
        
        // ── 有未处理消息：仅在没有弹窗时才显示 ──
        if (messageCount > 0) {
            // 弹窗已显示中，不做任何事（等它被删除后走下面 else 分支关闭）
            if (!canShowPumpNotify) return;

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
        // ── 无未处理消息：如果弹窗还在显示，说明被其他设备处理了 ──
        else {
            var card = document.querySelector(".float-card");
            if (card && !card.classList.contains("hide")) {
                console.log('[PumpNotify] 弹窗消息已被其他设备处理，自动关闭');
                hidenotice();
                canShowPumpNotify = true;
                pendingPumpMessage = null;
                isConfirming = false;
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
    
    // 保存消息信息
    window.currentPumpNotifyId = id;
    pendingPumpMessage = message;
    
    // 显示弹窗卡片
    shownotice(content);
}

// 重写确认开闸函数（带二次确认）
window.confirmOpen = async function() {
    // 如果已经在二次确认状态 → 执行真正的开闸
    if (isConfirming) {
        await executeConfirmOpen();
        return;
    }
    
    // 第一步：显示二次确认弹窗
    isConfirming = true;
    showConfirmDialog();
}

// 显示二次确认弹窗
function showConfirmDialog() {
    // 显示二次确认内容
    shownotice("请再次确认：是否确认开闸？此操作将执行开闸动作。");
    
    // 获取按钮元素并替换 onclick 事件
    var confirmBtn = document.querySelector(".float-card-read");
    var rejectBtn = document.querySelector(".float-card-mark-as-read");
    
    if (confirmBtn) {
        confirmBtn.onclick = null;
        confirmBtn.onclick = function() {
            executeConfirmOpen();
        };
    }
    
    if (rejectBtn) {
        rejectBtn.onclick = null;
        rejectBtn.onclick = function() {
            isConfirming=false;
            rejectOpen();
        };
    }
}

// 执行真正的开闸操作
async function executeConfirmOpen() {
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
        pendingPumpMessage = null;
        isConfirming = false;
        
    } catch (error) {
        console.error('确认开闸失败:', error);
        // 失败时恢复原始弹窗内容
        restoreOriginalNotice();
    }
}

// 取消二次确认
function cancelConfirm() {
    // 恢复原始消息弹窗
    if (pendingPumpMessage) {
        shownotice(pendingPumpMessage.content);
    } else {
        hidenotice();
    }
    
    // 恢复原始按钮行为
    restoreButtonHandlers();
    isConfirming = false;
}

// 恢复原始按钮的点击事件
function restoreButtonHandlers() {
    var confirmBtn = document.querySelector(".float-card-read");
    var rejectBtn = document.querySelector(".float-card-mark-as-read");
    
    if (confirmBtn) {
        confirmBtn.onclick = null;
        confirmBtn.onclick = function() {
            window.confirmOpen();
        };
    }
    
    if (rejectBtn) {
        rejectBtn.onclick = null;
        rejectBtn.onclick = function() {
            window.rejectOpen();
        };
    }
}

// 恢复到原始通知内容
function restoreOriginalNotice() {
    if (pendingPumpMessage) {
        shownotice(pendingPumpMessage.content);
    } else {
        hidenotice();
    }
    restoreButtonHandlers();
    isConfirming = false;
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
        pendingPumpMessage = null;
        
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

function shownotice(text) {
    var card = document.querySelector(".float-card");
    var messageEl = document.querySelector(".float-card-message");
    
    if (card && messageEl) {
        messageEl.textContent = text;
        card.classList.remove("hide");
    }
}

function hidenotice() {
    var card = document.querySelector(".float-card");
    if (card) {
        card.classList.add("hide");
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