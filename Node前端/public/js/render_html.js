console.log("渲染功能已加载！")
function render() {
            const head = document.head;
            const board = document.getElementsByClassName("dashboard");
            const script_import=document.getElementById('script_import');
            const navItems = document.querySelectorAll('.nav-item');
            // 当前激活的模块
            let currentActive = 'home';
            window.renderPanelByModule = function(moduleName) {
                console.log(`[导航切换] 当前模块: ${moduleName}`);
                if(moduleName=="home"){
                    head.innerHTML=home_head;
                    board.innerHTML=home_board;
                    script_import.innerHTML=home_script;
                    console.log("home回调已触发");
                }
                else if(moduleName=="warning"){
                    head.innerHTML=warning_head;
                    board.innerHTML=warning_board;
                    script_import.innerHTML=warning_import;
                    console.log("h回调已触发");
                }
                // 触发自定义事件，方便外部监听
                const customEvent = new CustomEvent('panelModuleChange', { detail: { module: moduleName } });
                window.dispatchEvent(customEvent);
            };
            
            // 高亮当前激活项
            function setActiveNav(module) {
                navItems.forEach(item => {
                    const navVal = item.getAttribute('data-nav');
                    if (navVal === module) {
                        item.classList.add('active');
                    } else {
                        item.classList.remove('active');
                    }
                });
            }
            
            // 切换面板的入口
            function switchToModule(moduleName) {
                if (currentActive === moduleName) return;
                currentActive = moduleName;
                setActiveNav(moduleName);
                
                // 添加简单淡入淡出效果
                leftPanel.style.transition = 'opacity 0.2s';
                rightPanel.style.transition = 'opacity 0.2s';
                leftPanel.style.opacity = '0.6';
                rightPanel.style.opacity = '0.6';
                
                // 调用渲染接口
                window.renderPanelByModule(moduleName);
                
                // 恢复透明度
                setTimeout(() => {
                    leftPanel.style.opacity = '1';
                    rightPanel.style.opacity = '1';
                }, 50);
            }
            
            // 绑定导航栏点击事件
            navItems.forEach(item => {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    const module = item.getAttribute('data-nav');
                    if (module === 'home') {
                        switchToModule('home');
                    } else if (module === 'monitor') {
                        switchToModule('monitor');
                    } else if (module === 'warning') {
                        switchToModule('warning');
                    }
                });
            });
            
            // 默认激活首页（高亮首页按钮，但不重新渲染，保持原有内容）
            setActiveNav('home');
            
            // 暴露全局方法方便调试
            window.switchModule = switchToModule;
        }
render();
