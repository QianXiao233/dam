// 滚动消息组件
const AlertBarScroll = (function() {
    // 私有变量
    let messages = [];
    const scrollInterval = 3000; // 每条信息显示时间(毫秒)
    const scrollDuration = 500; // 滚动动画持续时间(毫秒)
    const itemHeight = 40; // 每条信息的高度，与CSS中保持一致
    const maxMessages = 5; // 最大信息数量
    let currentIndex = 0;
    let scrollTimer = null;
    let isAnimating = false;
    let messageList = null;
    let isEmptyState = false; // 新增：标记是否为空状态

    // 初始化消息列表 - 复制第一条到最后，实现无缝滚动效果
    function initMessageList() {
        // 清空列表
        messageList.innerHTML = '';
        isEmptyState = messages.length === 0;
        
        // 如果没有消息，显示提示
        if (isEmptyState) {
            const emptyItem = document.createElement('div');
            emptyItem.className = 'alert-item';
            emptyItem.innerHTML = `
                <div class="alert-icon"></div>
                <span>暂无预警提示信息！</span>
            `;
            messageList.appendChild(emptyItem);

            // 清除滚动计时器
            if (scrollTimer) {
                clearTimeout(scrollTimer);
                scrollTimer = null;
            }
            return;
        }

        // 创建完整的消息列表，包含重复的第一条用于无缝过渡
        const fullMessages = [...messages, messages[0]];
        
        // 添加所有消息
        fullMessages.forEach(msg => {
            const item = createMessageItem(msg.text);
            messageList.appendChild(item);
        });
        
        // 重置滚动位置和状态
        currentIndex = 0;
        isAnimating = false;
        messageList.style.top = '0px';
        messageList.style.transition = 'none'; // 确保初始状态无过渡
        
        // 清除现有计时器并重新开始滚动
        if (scrollTimer) {
            clearTimeout(scrollTimer);
        }
        
        // 只有当消息数量大于1时才启动滚动
        if (messages.length > 1) {
            scrollTimer = setTimeout(scrollNext, scrollInterval);
        }
    }

    // 创建消息项
    function createMessageItem(text) {
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.innerHTML = `
            <div class="alert-icon"></div>
            <span>${text}</span>
        `;
        return div;
    }

    // 平滑滚动到指定索引
    function scrollToIndex(index) {
        if (isAnimating || isEmptyState || messages.length <= 1) return;
        
        isAnimating = true;
        const start = Date.now();
        const startPosition = messageList.offsetTop;
        const targetPosition = -index * itemHeight;
        const distance = targetPosition - startPosition;
        
        // 确保有过渡效果
        messageList.style.transition = '';
        
        function animate() {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / scrollDuration, 1);
            // 使用easeOutQuad缓动函数使动画更自然
            const easeProgress = 1 - (1 - progress) * (1 - progress);
            
            messageList.style.top = `${startPosition + distance * easeProgress}px`;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                isAnimating = false; // 动画完成
            }
        }
        
        requestAnimationFrame(animate);
    }

    // 滚动到下一条信息
    function scrollNext() {
        // 如果是空状态或只有一条信息，不执行滚动
        if (isEmptyState || messages.length <= 1) {
            return;
        }
        
        // 计算下一个索引
        const nextIndex = currentIndex + 1;
        
        // 执行滚动动画
        scrollToIndex(nextIndex);
        
        // 检查是否需要重置索引（关键修复）
        if (nextIndex === messages.length) {
            // 在动画完成后重置索引，但不改变视觉位置
            setTimeout(() => {
                // 关闭过渡效果
                messageList.style.transition = 'none';
                // 重置到起始位置
                messageList.style.top = '0px';
                // 立即更新索引
                currentIndex = 0;
                
                // 强制重绘
                void messageList.offsetWidth;
                
                // 安排下一次滚动
                scrollTimer = setTimeout(scrollNext, scrollInterval);
            }, scrollDuration);
        } else {
            currentIndex = nextIndex;
            // 安排下一次滚动
            scrollTimer = setTimeout(scrollNext, scrollInterval);
        }
    }

    // 公共方法
    return {
        // 初始化组件，支持空数组
        init: function(initialMessages = []) {
            // 获取DOM元素
            messageList = document.getElementById('alert-list');
            
            // 检查元素是否存在
            if (!messageList) {
                console.error('未找到ID为"alert-list"的元素');
                return;
            }
            
            // 处理初始消息，确保不超过最大数量
            if (Array.isArray(initialMessages)) {
                messages = initialMessages.slice(0, maxMessages).map(msg => ({
                    text: typeof msg === 'object' && msg.text ? msg.text : String(msg)
                }));
            } else {
                messages = [];
            }
            
            // 初始化消息列表
            initMessageList();
        },
        
        // 添加新消息
        addMessage: function(text) {
            // 验证输入
            if (!text) {
                console.warn('消息内容不能为空');
                return false;
            }

            // 检查是否已达到最大数量
            if (messages.length >= maxMessages) {
                // 移除最旧的一条信息
                messages.shift();
            }

            // 添加新信息到列表末尾
            messages.push({
                text: text
            });

            // 重新初始化消息列表
            initMessageList();
            return true;
        },
        
        // 获取当前消息列表
        getMessages: function() {
            return [...messages]; // 返回副本，防止外部直接修改
        },
        
        // 清空所有消息
        clearMessages: function() {
            messages = [];
            initMessageList();
        }
    };
})();
