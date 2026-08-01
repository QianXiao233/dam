let canShowModal = true;
let isPolling = true;
let pollInterval = 3000; // 初始3秒

const audio=new AudioPlayer();
audio.load("/sound/warning.mp3");
async function drown() {
    if (!canShowModal) return;
    
    try {
        // 获取消息数量
        const countResponse = await fetch(window.apiUrls.java_url+"/get_messagecount", {
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
        
        if (!countResponse.ok) {
            throw new Error(`HTTP ${countResponse.status}`);
        }
        
        const messageCount = await countResponse.json();
        
        // 数量大于0才获取消息
        if (messageCount > 0) {
            console.log(`发现 ${messageCount} 条消息，正在获取...`);
            
            const messageResponse = await fetch(window.apiUrls.java_url+"/get_message", {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });
            
            if (!messageResponse.ok) {
                throw new Error(`HTTP ${messageResponse.status}`);
            }
            
            const result = await messageResponse.json();
            
            if (result && result.type === "DrownWarning") {
                handleWarning(result,"Drown");
            }
            else if(result&&result.type ==="PersonStatus"){
                handleWarning(result,"Person");
            }
        }
        
        // 重置轮询间隔（成功时）
        pollInterval = 3000;
        
    } catch (error) {
        console.error('请求失败:', error);
        
        // 错误时延长轮询间隔，避免频繁请求
        pollInterval = Math.min(pollInterval * 1.5, 10000);
        console.log(`下次轮询将在 ${pollInterval/1000} 秒后`);
    }
}

function handleWarning(message,type) {
    if (canShowModal === false) return; // 已有弹窗正在显示
    
    canShowModal = false;
    
    const { id, content } = message;
    var title;
    if(type==="Drown")title="发现疑似人员落水！";
    else if(type==="Person")title="大巴岸边发现人员！";
    // 更新弹窗内容
    const messageElement = document.getElementById('warn_info');
    if (messageElement) {
        messageElement.textContent = content;
    }
    // 更新弹窗标题
    const titleElement = document.getElementById('warn_title');
    if (titleElement) {
        titleElement.textContent = title;
    }
    
    // 显示弹窗
    showModal();
    audio.play();
    
    // 3秒后删除消息并关闭弹窗
    setTimeout(async () => {
        await delete_message(id);
        closeModal();
        canShowModal = true;
    }, 3000);
}

async function delete_message(mid) {
    if (!mid) return;
    
    try {
        const response = await fetch(window.apiUrls.java_url+"/delete_message", {
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
function startPolling() {
    setInterval(async () => {
        await drown();
    }, pollInterval);
}

// 启动轮询
startPolling();