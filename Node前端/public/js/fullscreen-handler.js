// 全屏功能处理模块
const FullscreenHandler = (function() {
    // 私有变量
    let iconImg = null;
    let fullscreenIconPath = '';
    let exitFullscreenIconPath = '';
    
    // 检查是否支持全屏API
    function checkFullscreenSupport() {
        return !!(document.fullscreenEnabled || 
                  document.webkitFullscreenEnabled || 
                  document.msFullscreenEnabled);
    }
    
    // 切换全屏状态
    function toggleFullscreen() {
        // 检查是否支持全屏
        if (!checkFullscreenSupport()) {
            alert('您的浏览器不支持全屏功能');
            return;
        }
        
        // 检查当前是否处于全屏状态
        const isFullscreen = !!document.fullscreenElement ||
                            !!document.webkitFullscreenElement ||
                            !!document.msFullscreenElement;
        
        if (isFullscreen) {
            // 退出全屏
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            // 进入全屏（使用整个页面）
            const target = document.documentElement;
            if (target.requestFullscreen) {
                target.requestFullscreen();
            } else if (target.webkitRequestFullscreen) {
                target.webkitRequestFullscreen();
            } else if (target.msRequestFullscreen) {
                target.msRequestFullscreen();
            }
        }
    }
    
    // 更新图标显示
    function updateFullscreenIcon() {
        if (!iconImg) return;
        
        const isFullscreen = !!document.fullscreenElement ||
                            !!document.webkitFullscreenElement ||
                            !!document.msFullscreenElement;
        
        if (isFullscreen) {
            // 当前是全屏状态，显示退出全屏图标
            iconImg.src = exitFullscreenIconPath;
            iconImg.alt = '退出全屏';
        } else {
            // 当前不是全屏状态，显示进入全屏图标
            iconImg.src = fullscreenIconPath;
            iconImg.alt = '进入全屏';
        }
    }
    
    // 公共方法
    return {
        // 初始化全屏功能
        init: function(options) {
            // 验证参数
            if (!options || !options.iconId) {
                console.error('初始化全屏功能失败：缺少必要参数');
                return;
            }
            
            // 获取图标元素
            iconImg = document.getElementById(options.iconId);
            if (!iconImg) {
                console.error(`未找到ID为"${options.iconId}"的元素`);
                return;
            }
            
            // 设置图标路径
            fullscreenIconPath = options.fullscreenIconPath || './assets/images/full-screen.png';
            exitFullscreenIconPath = options.exitFullscreenIconPath || './assets/images/tuichuzhuanhuan.png';
            
            // 添加点击事件
            iconImg.addEventListener('click', toggleFullscreen);
            
            // 监听全屏状态变化事件
            document.addEventListener('fullscreenchange', updateFullscreenIcon);
            document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
            document.addEventListener('msfullscreenchange', updateFullscreenIcon);
            
            // 添加悬浮样式
            iconImg.style.cursor = 'pointer';
            
            // 初始化图标显示
            updateFullscreenIcon();
        }
    };
})();
