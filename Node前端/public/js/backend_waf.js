(function() {
    'use strict';
    console.log('智御安澜前端防护功能启动');
    
    let hookDetected = false;
    let protectionTriggered = false;
    
    // 检测函数是否被Hook
    function isFunctionHooked(func, funcName) {
        if (typeof func !== 'function') return false;
        
        const fnStr = func.toString();
        
        // Hook特征列表
        const hookPatterns = [
            'hook_user',
            '假数据',
            '返回假数据',
            'hook_',
            'async function()',
            'return {\n                    username:'
        ];
        
        for (let pattern of hookPatterns) {
            if (fnStr.includes(pattern)) {
                console.log(`[防护] ${funcName} 检测到Hook特征: ${pattern}`);
                return true;
            }
        }
        
        return false;
    }
    
    // 检测Tampermonkey
    function detectTampermonkey() {
        if (typeof window.__tm !== 'undefined') return true;
        if (typeof window.__TM_GM_ !== 'undefined') return true;
        if (typeof window.GM_info !== 'undefined') return true;
        
        // 检查脚本标签
        const scripts = document.querySelectorAll('script');
        for (let script of scripts) {
            if (script.src && script.src.includes('tampermonkey')) {
                return true;
            }
        }
        return false;
    }
    
    // 强制触发保护（直接执行，不依赖任何异步）
    function forceTriggerProtection() {
        if (protectionTriggered) return;
        protectionTriggered = true;
        
        console.log('[防护] ⚠️ 触发安全保护！页面将被清除');
        
        // 立即清除页面内容
        try {
            // 清空body
            if (document.body) {
                document.body.innerHTML = '';
            }
            
            // 创建警告页面
            const warningHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>安全警告</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                            font-family: 'Microsoft YaHei', sans-serif;
                        }
                        .warning-container {
                            text-align: center;
                            background: rgba(255,255,255,0.95);
                            padding: 40px;
                            border-radius: 20px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                            animation: shake 0.5s ease-in-out;
                        }
                        @keyframes shake {
                            0%,100% { transform: translateX(0); }
                            25% { transform: translateX(-10px); }
                            75% { transform: translateX(10px); }
                        }
                        h1 { color: #e74c3c; font-size: 28px; margin-bottom: 20px; }
                        p { color: #333; font-size: 16px; margin-bottom: 30px; }
                        .code { 
                            background: #f0f0f0; 
                            padding: 10px; 
                            border-radius: 5px;
                            font-family: monospace;
                            color: #e74c3c;
                        }
                        button {
                            background: #e74c3c;
                            color: white;
                            border: none;
                            padding: 12px 30px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        }
                        button:hover { background: #c0392b; }
                    </style>
                </head>
                <body>
                    <div class="warning-container">
                        <h1>⚠️[智御安澜前端防护]页面加载失败</h1>
                        <p>检测到未知脚本加载，系统已阻止访问。</p>
                        <p>错误代码：<span class="code">SEC_HOOK_DETECTED</span></p>
                    </div>
                    <script>
                        // 阻止所有后续脚本执行
                        window.stop();
                        // 清除所有存储
                        localStorage.clear();
                        sessionStorage.clear();
                        // 阻止网络请求
                        window.fetch = function(){ return Promise.reject(); };
                        window.XMLHttpRequest = function(){ throw new Error("Blocked"); };
                    <\/script>
                </body>
                </html>
            `;
            
            document.open();
            document.write(warningHtml);
            document.close();
            
        } catch(e) {
            // 如果以上失败，使用alert + 无限循环
            alert('安全检测失败！检测到非法篡改程序！');
            while(true) {
                // 无限循环阻止页面执行
                console.log('Blocked');
            }
        }
    }
    
    // 主要检测函数
    function checkAndProtect() {
        if (protectionTriggered) return true;
        
        let hooked = false;
        
        // 检测 yanzheng
        if (typeof window.yanzheng !== 'undefined') {
            if (isFunctionHooked(window.yanzheng, 'yanzheng')) {
                hooked = true;
            }
        }
        
        // 检测 valibate_token
        if (typeof window.valibate_token !== 'undefined') {
            if (isFunctionHooked(window.valibate_token, 'valibate_token')) {
                hooked = true;
            }
        }
        
        // 检测 Tampermonkey
        if (detectTampermonkey()) {
            console.log('[防护] 检测到Tampermonkey');
            hooked = true;
        }
        
        if (hooked && !protectionTriggered) {
            console.log('[防护] ❌ 检测到Hook，立即触发保护！');
            forceTriggerProtection();
            return true;
        }
        
        return false;
    }
    
    // 立即执行检测（同步，第一时间）
    try {
        checkAndProtect();
    } catch(e) {
        console.error('[防护] 检测出错:', e);
    }
    
    // 多次检测，确保能捕获
    const intervals = [0, 10, 25, 50, 100, 200];
    for (let delay of intervals) {
        setTimeout(() => {
            if (!protectionTriggered) {
                checkAndProtect();
            }
        }, delay);
    }
    
    // 使用 requestAnimationFrame 高频检测
    let rafCount = 0;
    function rafCheck() {
        rafCount++;
        if (!protectionTriggered) {
            checkAndProtect();
        }
        if (!protectionTriggered && rafCount < 500) {
            requestAnimationFrame(rafCheck);
        }
    }
    requestAnimationFrame(rafCheck);
    
    // 使用 MutationObserver 监控DOM
    const observer = new MutationObserver(function() {
        if (!protectionTriggered) {
            checkAndProtect();
        }
    });
    
    try {
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true
        });
    } catch(e) {}
    
    // 拦截 Object.defineProperty
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
        if (obj === window && (prop === 'yanzheng' || prop === 'valibate_token')) {
            if (descriptor.value && typeof descriptor.value === 'function') {
                const fnStr = descriptor.value.toString();
                if (fnStr.includes('hook_user')) {
                    console.log(`[防护] 拦截到Hook定义: ${prop}`);
                    // 不执行原始定义，阻止Hook
                    return false;
                }
            }
        }
        return originalDefineProperty.call(this, obj, prop, descriptor);
    };
    
    console.log('[防护] 所有检测机制已启动，等待检测...');
    
    // 如果有定时器检测到，立即处理
    setTimeout(() => {
        if (!protectionTriggered) {
            console.log('[防护] 最终检测...');
            checkAndProtect();
        }
    }, 500);
    
    let detectionCount = 0;
    
    function detect() {
        detectionCount++;
        
        const startTime = performance.now();
        debugger;
        const duration = performance.now() - startTime;
        
        // 如果 debugger 导致延迟超过 50ms，说明有调试器
        if (duration > 50) {
            alert('[安全警告]本系统禁止使用开发人员工具，请关闭后重新刷新页面！');
            location.reload(true);
            return;
        }
        
        // 持续检测（最多20次）
        if (detectionCount < 20) {
            setTimeout(detect, 500);
        }
    }
    
    setTimeout(detect, 500);
})();  