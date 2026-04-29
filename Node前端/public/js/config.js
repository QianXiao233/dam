const home_board=`<!-- Header -->
        <div class="header">
            <div class="header-left">
                <span id="currentTime">2024-08-16 16:25:30</span>
            </div>
            <div class="header-title">智御安澜 数字孪生驾驶舱</div>
            <div class="header-right">
            </div>
        </div>
        
        <!-- Left Panel -->
        <div class="left-panel" id="leftPanel" style="height: 92%;">
            <!-- Dam Overview -->
            <div class="panel-section" style="height: 23%;">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title">大坝概述</div>
                    <div class="panel-subtitle">Overview of the dam</div>
                </div>
                <div class="data-grid">
                    <div class="grid-left" id="dam-left"></div>
                    <div class="grid-center" id="dam-center"></div>
                    <div class="grid-right" id="dam-right"></div>
                </div>
            </div>

            <!-- Weather Condition -->
            <div class="panel-section" style="height: 20%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title">天气情况</div>
                    <div class="panel-subtitle">Weather condition</div>
                </div>
                <div class="weather-grid" id="weather-grid"></div>
            </div>

            <!-- Water Quality Data -->
            <div class="panel-section" style="height: 27%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title">水质数据概览</div>
                    <div class="panel-subtitle">Overview of water quality data</div>
                </div>
                <div class="chart-container" id="waterQualityChart"></div>
            </div>

            <!-- Dam Vibration Monitoring -->
            <div class="panel-section" style="height: 28%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title">坝体震动监测</div>
                    <div class="panel-subtitle">Dam vibration monitoring</div>
                </div>
                <div class="chart-container" id="vibrationChart"></div>
            </div>
        </div>
        
        <!-- Right Panel -->
        <div class="right-panel" id="rightPanel" style="height: 92%;">
            <!-- Water Level Trend -->
            <div class="panel-section" style="height: 19%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title clickable" data-rotation="0">水位趋势</div>
                    <div class="panel-subtitle">Water level trend</div>
                </div>
                <div class="chart-container" id="waterLevelChart"></div>
            </div>

            <!-- Water Level Forecast -->
            <div class="panel-section" style="height: 20%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title clickable" data-rotation="90" onclick="window.location.href='/forecast.html'">水位预报</div>
                    <div class="panel-subtitle">Water level forecast</div>
                </div>
                <div class="trapezoid-container" id="trapezoid-container"></div>
            </div>
            
            <!-- Perimeter Security -->
            <div class="panel-section" style="height: 30%">
                <div class="panel-header">
                    <div class="panel-icon"></div>
                    <div class="panel-title clickable" data-rotation="180" onclick="window.location.href='/monitor.html'" style="cursor:pointer">周界安全</div>
                    <div class="panel-subtitle">Perimeter security</div>
                </div>
                <div class="camera-grid" id="camera-grid" style="height: 80%;padding: 2% 4%;font-size: 0.8vw;"></div>
                <div id="video-container">
                    <div id="video-frame">
                        <img id="video_feed" src="" crossorigin="anonymous"></img>
                    </div>
                </div>
            </div>

            <!-- Landslide Monitoring -->
            <div class="panel-section" style="height: 31%">
                <div class="panel-header" style="padding: 0px;">
                    <div class="panel-icon"></div>
                    <div class="panel-title clickable" data-rotation="270">山体滑坡监测</div>
                    <div class="panel-subtitle">Landslide monitoring</div>
                </div>
                <div class="gauge-container">
                    <div class="">
                        <div class="gauge" id="gauge1"></div>
                        <div class="gauge-desc">山体位移</div>
                    </div>
                    <div class="">
                        <div class="gauge" id="gauge2"></div>
                        <div class="gauge-desc">土壤湿度</div>
                    </div>
                </div>
            </div>
        </div>`
const home_head=`<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>网安水稳数字孪生驾驶舱</title>
    <link rel="stylesheet" href="/css/style.css">
    <style>
        /* 进度条css样式 */
        #container {
            position: absolute;
            width: 400px;
            height: 16px;
            top: 50%;
            left: 50%;
            margin-left: -200px;
            margin-top: -8px;
            border-radius: 8px;
            border: 1px solid #009999;
            overflow: hidden;
            z-index: 25;
        }

        #per {
            height: 100%;
            width: 0px;
            background: #00ffff;
            color: #00ffff;
            line-height: 15px;
        }

        /* Three.js 容器样式 */
        #webgl {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: auto;
        }

        /* 右侧面板交互样式 */
        .right-panel {
            pointer-events: auto;
        }

        .panel-title.clickable {
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .panel-title.clickable:hover {
            color: #00ffff;
            text-shadow: 0 0 10px rgba(0, 255, 255, 0.7);
        }

        /* 底部悬浮导航栏 */
        .bottom-navbar {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: auto;
            min-width: 280px;
            max-width: 90%;
            background: rgba(10, 20, 30, 0.85);
            backdrop-filter: blur(16px);
            border-radius: 60px;
            padding: 10px 20px;
            z-index: 10000;
            box-shadow: 0 8px 28px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(72, 187, 255, 0.3) inset;
            transition: all 0.3s ease;
            border: 1px solid rgba(0, 255, 255, 0.3);
            pointer-events: auto;
        }

        .bottom-navbar:hover {
            background: rgba(10, 30, 45, 0.92);
            box-shadow: 0 10px 32px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(0, 255, 255, 0.5) inset;
        }

        .nav-items {
            display: flex;
            justify-content: space-around;
            align-items: center;
            gap: 2rem;
            list-style: none;
            margin: 0;
            padding: 0;
        }

        .nav-item {
            flex: 1;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 8px 12px;
            border-radius: 40px;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(4px);
            border: 1px solid rgba(0, 255, 255, 0.2);
        }

        .nav-item a {
            text-decoration: none;
            font-weight: 700;
            font-size: 1.1rem;
            letter-spacing: 1px;
            background: linear-gradient(135deg, #E0F2FE, #A5F3FC);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 0 5px rgba(0, 255, 255, 0.3);
            transition: all 0.2s;
            display: block;
        }

        .nav-item.active {
            background: rgba(0, 150, 200, 0.6);
            border: 1px solid #00FFFF;
            box-shadow: 0 0 12px rgba(0, 255, 255, 0.4);
        }

        .nav-item.active a {
            color: #FFFFFF;
            background: none;
            -webkit-background-clip: unset;
            background-clip: unset;
            text-shadow: 0 0 8px cyan;
        }

        .nav-item:hover {
            background: rgba(0, 180, 230, 0.5);
            transform: translateY(-2px);
        }

        @media (max-width: 700px) {
            .bottom-navbar {
                padding: 6px 12px;
                min-width: 240px;
            }
            .nav-item a {
                font-size: 0.9rem;
            }
            .nav-item {
                padding: 5px 8px;
            }
            .nav-items {
                gap: 0.8rem;
            }
        }

        /* 面板切换过渡效果 */
        .left-panel, .right-panel {
            transition: opacity 0.2s ease;
        }
        /* ========= 顶部中央悬浮预警卡片样式（不影响任何原有布局） ========= */
        .top-warning-float {
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            width: auto;
            min-width: 300px;
            max-width: 450px;
            opacity: 0.85;
            transition: opacity 0.3s ease;
            pointer-events: none; /* 不干扰下方元素点击 */
        }

        .top-warning-float:hover {
            opacity: 1;
        }

        /* 预警卡片基础样式 - 横向紧凑 */
        .top-warning-card {
            width: 100%;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
            border-radius: 40px;
            padding: 8px 16px;
            background: transparent;
        }

        .top-warning-card.hidden {
            display: none;
        }

        .top-warning-card.visible {
            display: block;
        }

        .top-alert-panel {
            border-radius: 36px;
            padding: 0.7rem 1.2rem 0.7rem 1.2rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 15px;
            text-align: center;
            backdrop-filter: blur(2px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35) inset, 0 3px 8px rgba(255, 255, 200, 0.25) inset;
        }

        /* 符号区域 */
        .top-symbol-area {
            position: relative;
            margin-bottom: 0;
            margin-right: 8px;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
            flex-shrink: 0;
        }

        .top-triangle {
            width: 0;
            height: 0;
            border-left: 42px solid transparent;
            border-right: 42px solid transparent;
            border-bottom: 72px solid;
            position: relative;
            filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.25));
        }

        .top-triangle::after {
            content: "";
            position: absolute;
            top: 5px;
            left: -38px;
            width: 0;
            height: 0;
            border-left: 38px solid transparent;
            border-right: 38px solid transparent;
            border-bottom: 65px solid rgba(255, 250, 230, 0.35);
            pointer-events: none;
        }

        .top-exclamation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3.2rem;
            font-weight: 900;
            font-family: 'Segoe UI', 'Poppins', 'Impact', system-ui, sans-serif;
            letter-spacing: -2px;
            line-height: 1;
            pointer-events: none;
            z-index: 2;
        }

        .top-warning-text {
            margin-top: 0;
            text-align: left;
            flex: 1;
        }

        .top-main-title {
            font-size: 1.2rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: linear-gradient(135deg, #FFF6E0, #FFD966);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            margin-bottom: 0.2rem;
        }

        .top-sub-message {
            font-size: 0.7rem;
            font-weight: 700;
            display: inline-block;
            padding: 0.25rem 0.8rem;
            border-radius: 60px;
            backdrop-filter: blur(2px);
            letter-spacing: 0.5px;
            background: rgba(0, 0, 0, 0.4);
            box-shadow: inset 0 0 2px rgba(255, 255, 200, 0.5), 0 1px 3px rgba(0, 0, 0, 0.2);
            color: #FFF5E6;
        }

        .top-extra-note {
            margin-top: 4px;
            font-size: 0.6rem;
            font-weight: 500;
            opacity: 0.85;
            color: #FFE9C7;
        }

        /* 红色预警顶部样式 */
        .top-red-card {
            background: rgba(139, 0, 0, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 80, 40, 0.6) inset;
            animation: topPulseRed 2.2s infinite;
        }
        .top-red-card .top-alert-panel {
            background: #DC2626;
        }
        .top-red-card .top-triangle {
            border-bottom-color: #FFE8C5;
        }
        .top-red-card .top-exclamation {
            color: #B91C1C;
            text-shadow: 0 2px 8px rgba(255, 200, 100, 0.9), 0 0 8px rgba(255, 80, 0, 0.8);
        }

        /* 橙色预警顶部样式 */
        .top-orange-card {
            background: rgba(163, 82, 0, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 140, 50, 0.6) inset;
            animation: topPulseOrange 2.4s infinite;
        }
        .top-orange-card .top-alert-panel {
            background: #F97316;
        }
        .top-orange-card .top-triangle {
            border-bottom-color: #FFF0C0;
        }
        .top-orange-card .top-exclamation {
            color: #C2410C;
            text-shadow: 0 2px 8px rgba(255, 210, 100, 0.9), 0 0 6px rgba(255, 100, 0, 0.6);
        }

        /* 黄色预警顶部样式 */
        .top-yellow-card {
            background: rgba(158, 123, 40, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 220, 80, 0.6) inset;
            animation: topPulseYellow 2.6s infinite;
        }
        .top-yellow-card .top-alert-panel {
            background: #EAB308;
        }
        .top-yellow-card .top-triangle {
            border-bottom-color: #FFF5DE;
        }
        .top-yellow-card .top-exclamation {
            color: #B45309;
            text-shadow: 0 2px 8px rgba(255, 230, 120, 1), 0 0 6px rgba(255, 160, 0, 0.7);
        }

        /* 顶部脉冲动画 */
        @keyframes topPulseRed {
            0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5), 0 0 0 0 rgba(200, 50, 20, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0), 0 0 0 8px rgba(200, 50, 20, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 0 0 0 rgba(200, 50, 20, 0); }
        }
        @keyframes topPulseOrange {
            0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.5), 0 0 0 0 rgba(255, 140, 0, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(249, 115, 22, 0), 0 0 0 8px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0), 0 0 0 0 rgba(255, 140, 0, 0); }
        }
        @keyframes topPulseYellow {
            0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.5), 0 0 0 0 rgba(245, 200, 0, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(234, 179, 8, 0), 0 0 0 8px rgba(245, 200, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0), 0 0 0 0 rgba(245, 200, 0, 0); }
        }

        /* 响应式调整 */
        @media (max-width: 600px) {
            .top-warning-float {
                min-width: 260px;
                top: 12px;
            }
            .top-triangle {
                border-left: 32px solid transparent;
                border-right: 32px solid transparent;
                border-bottom: 55px solid;
            }
            .top-triangle::after {
                top: 4px;
                left: -29px;
                border-left: 29px solid transparent;
                border-right: 29px solid transparent;
                border-bottom: 50px solid rgba(255, 250, 230, 0.35);
            }
            .top-exclamation {
                font-size: 2.5rem;
            }
            .top-main-title {
                font-size: 1rem;
            }
            .top-sub-message {
                font-size: 0.6rem;
                padding: 0.2rem 0.6rem;
            }
            .top-extra-note {
                font-size: 0.5rem;
            }
            .top-alert-panel {
                padding: 0.5rem 1rem;
                gap: 10px;
            }
        }
    </style>
    <script src="/js/echarts.js"></script>
    <script src="/js/alert-bar-scroll.js"></script>
    <script src="/js/apiUtils.js"></script>`
const home_script=`
    <script src="/js/three.js" type="module"></script>
    <script src="/js/update_time.js"></script>
    <script src="/js/dam_chart.js"></script>
    <script src="/js/weather_chart.js"></script>
    <script src="/js/water_level_rt_chart.js"></script>
    <script src="/js/water_level_rt_data.js"></script>
    <script src="/js/vibration_chart.js"></script>
    <script src="/js/vibration_data.js"></script>
    <script src="/js/water_level_p_chart.js"></script>
    <script src="/js/water_level_p_data.js"></script>
    <script src="/js/water_quality_chart.js"></script>
    <script src="/js/weather_forecast.js"></script>
    <script src="/js/camera_chart.js"></script>
    <script src="/js/camera_data.js"></script>
    <script src="/js/gauge_chart.js"></script>
    <script src="/js/config.js"></script>
    <script src="/js/render_html.js"></script>
    <script src="/js/warning1.js"></script>`
const warning_head=`<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>智慧水位“四预”系统</title>
    <link rel="stylesheet" href="/css/forecast.css">
    <style>
        /* 进度条css样式 */
        #container {
            position: absolute;
            width: 400px;
            height: 16px;
            top: 50%;
            left: 50%;
            margin-left: -200px;
            margin-top: -8px;
            border-radius: 8px;
            border: 1px solid #009999;
            overflow: hidden;
            z-index: 25;
        }

        #per {
            height: 100%;
            width: 0px;
            background: #00ffff;
            color: #00ffff;
            line-height: 15px;
        }

        /* ========= 顶部中央悬浮预警卡片样式（不影响任何原有布局） ========= */
        .top-warning-float {
            position: fixed;
            top: 120px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            width: auto;
            min-width: 300px;
            max-width: 450px;
            opacity: 0.85;
            transition: opacity 0.3s ease;
            pointer-events: none; /* 不干扰下方元素点击 */
        }

        .top-warning-float:hover {
            opacity: 1;
        }

        /* 预警卡片基础样式 - 横向紧凑 */
        .top-warning-card {
            width: 100%;
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
            border-radius: 40px;
            padding: 8px 16px;
            background: transparent;
        }

        .top-warning-card.hidden {
            display: none;
        }

        .top-warning-card.visible {
            display: block;
        }

        .top-alert-panel {
            border-radius: 36px;
            padding: 0.7rem 1.2rem 0.7rem 1.2rem;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            gap: 15px;
            text-align: center;
            backdrop-filter: blur(2px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35) inset, 0 3px 8px rgba(255, 255, 200, 0.25) inset;
        }

        /* 符号区域 */
        .top-symbol-area {
            position: relative;
            margin-bottom: 0;
            margin-right: 8px;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.25));
            flex-shrink: 0;
        }

        .top-triangle {
            width: 0;
            height: 0;
            border-left: 42px solid transparent;
            border-right: 42px solid transparent;
            border-bottom: 72px solid;
            position: relative;
            filter: drop-shadow(0 3px 5px rgba(0, 0, 0, 0.25));
        }

        .top-triangle::after {
            content: "";
            position: absolute;
            top: 5px;
            left: -38px;
            width: 0;
            height: 0;
            border-left: 38px solid transparent;
            border-right: 38px solid transparent;
            border-bottom: 65px solid rgba(255, 250, 230, 0.35);
            pointer-events: none;
        }

        .top-exclamation {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 3.2rem;
            font-weight: 900;
            font-family: 'Segoe UI', 'Poppins', 'Impact', system-ui, sans-serif;
            letter-spacing: -2px;
            line-height: 1;
            pointer-events: none;
            z-index: 2;
        }

        .top-warning-text {
            margin-top: 0;
            text-align: left;
            flex: 1;
        }

        .top-main-title {
            font-size: 1.2rem;
            font-weight: 800;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            background: linear-gradient(135deg, #FFF6E0, #FFD966);
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
            margin-bottom: 0.2rem;
        }

        .top-sub-message {
            font-size: 0.7rem;
            font-weight: 700;
            display: inline-block;
            padding: 0.25rem 0.8rem;
            border-radius: 60px;
            backdrop-filter: blur(2px);
            letter-spacing: 0.5px;
            background: rgba(0, 0, 0, 0.4);
            box-shadow: inset 0 0 2px rgba(255, 255, 200, 0.5), 0 1px 3px rgba(0, 0, 0, 0.2);
            color: #FFF5E6;
        }

        .top-extra-note {
            margin-top: 4px;
            font-size: 0.6rem;
            font-weight: 500;
            opacity: 0.85;
            color: #FFE9C7;
        }

        /* 红色预警顶部样式 */
        .top-red-card {
            background: rgba(139, 0, 0, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 80, 40, 0.6) inset;
            animation: topPulseRed 2.2s infinite;
        }
        .top-red-card .top-alert-panel {
            background: #DC2626;
        }
        .top-red-card .top-triangle {
            border-bottom-color: #FFE8C5;
        }
        .top-red-card .top-exclamation {
            color: #B91C1C;
            text-shadow: 0 2px 8px rgba(255, 200, 100, 0.9), 0 0 8px rgba(255, 80, 0, 0.8);
        }

        /* 橙色预警顶部样式 */
        .top-orange-card {
            background: rgba(163, 82, 0, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 140, 50, 0.6) inset;
            animation: topPulseOrange 2.4s infinite;
        }
        .top-orange-card .top-alert-panel {
            background: #F97316;
        }
        .top-orange-card .top-triangle {
            border-bottom-color: #FFF0C0;
        }
        .top-orange-card .top-exclamation {
            color: #C2410C;
            text-shadow: 0 2px 8px rgba(255, 210, 100, 0.9), 0 0 6px rgba(255, 100, 0, 0.6);
        }

        /* 黄色预警顶部样式 */
        .top-yellow-card {
            background: rgba(158, 123, 40, 0.95);
            border-radius: 40px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 220, 80, 0.6) inset;
            animation: topPulseYellow 2.6s infinite;
        }
        .top-yellow-card .top-alert-panel {
            background: #EAB308;
        }
        .top-yellow-card .top-triangle {
            border-bottom-color: #FFF5DE;
        }
        .top-yellow-card .top-exclamation {
            color: #B45309;
            text-shadow: 0 2px 8px rgba(255, 230, 120, 1), 0 0 6px rgba(255, 160, 0, 0.7);
        }

        /* 顶部脉冲动画 */
        @keyframes topPulseRed {
            0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5), 0 0 0 0 rgba(200, 50, 20, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0), 0 0 0 8px rgba(200, 50, 20, 0); }
            100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0), 0 0 0 0 rgba(200, 50, 20, 0); }
        }
        @keyframes topPulseOrange {
            0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.5), 0 0 0 0 rgba(255, 140, 0, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(249, 115, 22, 0), 0 0 0 8px rgba(255, 140, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0), 0 0 0 0 rgba(255, 140, 0, 0); }
        }
        @keyframes topPulseYellow {
            0% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.5), 0 0 0 0 rgba(245, 200, 0, 0.4); }
            70% { box-shadow: 0 0 0 12px rgba(234, 179, 8, 0), 0 0 0 8px rgba(245, 200, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0), 0 0 0 0 rgba(245, 200, 0, 0); }
        }

        /* 响应式调整 */
        @media (max-width: 600px) {
            .top-warning-float {
                min-width: 260px;
                top: 12px;
            }
            .top-triangle {
                border-left: 32px solid transparent;
                border-right: 32px solid transparent;
                border-bottom: 55px solid;
            }
            .top-triangle::after {
                top: 4px;
                left: -29px;
                border-left: 29px solid transparent;
                border-right: 29px solid transparent;
                border-bottom: 50px solid rgba(255, 250, 230, 0.35);
            }
            .top-exclamation {
                font-size: 2.5rem;
            }
            .top-main-title {
                font-size: 1rem;
            }
            .top-sub-message {
                font-size: 0.6rem;
                padding: 0.2rem 0.6rem;
            }
            .top-extra-note {
                font-size: 0.5rem;
            }
            .top-alert-panel {
                padding: 0.5rem 1rem;
                gap: 10px;
            }
        }
    </style>`
const warning_board=`<!-- Header -->
        <div class="header">
            <div class="header-left">
                <span id="currentTime">2024-08-16 16:25:30</span>
            </div>
            <div class="header-title">智御安澜 洪水智慧“四预”系统</div>
            <div class="header-right">
                <span>ID：root</span>
                <span><img src="/images/logout.png" alt="">退出</span>
            </div>
        </div>
    </div>
    <!--left -->
    <div class="left-panel">
        <div class="panel-header">
            <div class="panel-icon"></div>
            <div class="panel-title">实时水位</div>
            <div class="panel-subtitle">Water level trend</div>
        </div>
        <div style=" position: absolute;top: 4%; width: 98%;height: 17%;">

            <div class="chart-container" id="waterLevelChart" style="width: 100%;height: 100%;"></div>
        </div>


        <!-- ==========================radio========================= -->

        <div class="left-radio">
            <div class="panel-header">
                <div class="panel-icon"></div>
                <div class="panel-title">预演</div>
                <div class="panel-subtitle">Rehearsal</div>
            </div>
        </div>
        <div>
            <img src="/imagesT/radio背景.png" style="width: 100%;position: absolute;top: 25%;height: 2%;">
            <p class="videoFont">&nbsp;&nbsp;1.库区淹没预演</p>
            <video muted src="/video/淹没.mp4"
                style="width: 100%;position: absolute;top: 27.5%;height: 14.5%;left: 0%;" class="video"
                data-index="0"></video>
        </div>
        <div>
            <img src="/imagesT/radio背景.png" style="width: 100%;position: absolute;top: 39.5%;height: 2%;">
            <p class="videoFont" style="width: 90%;position: absolute;top: 39.5%;height: 2%;">&nbsp;&nbsp;2.水库溃坝模拟</p>
            <video muted src="/video/溃坝.mp4"
                style="width: 100%;position: absolute;top: 41.5%;height: 14.5%;left: 0%;" class="video"
                data-index="1"></video>
        </div>
        <div>
            <img src="/imagesT/radio背景.png" style="width: 100%;position: absolute;top: 54%;height: 2%;">
            <p style="width: 90%;position: absolute;top: 54%;height: 2%;" class="videoFont">&nbsp;&nbsp;3.水库下游预演</p>
            <video muted src="/video/预演.mp4"
                style="width: 100%;position: absolute;top: 56.5%;height: 14.5%;left: 0%;" class="video"
                data-index="2"></video>
        </div>
        <div>
            <img src="/imagesT/radio背景.png" style="width: 100%;position: absolute;top: 69%;height: 2%;">
            <p style="width: 90%;position: absolute;top: 69%;height: 2%;" class="videoFont">&nbsp;&nbsp;4.水库调度转移</p>
            <video muted src="/video/调度.mp4"
                style="width: 100%;position: absolute;top: 71.5%;height: 14.5%;left: 0%;" class="video"
                data-index="3"></video>
        </div>
    </div>


    <!-- right -->
    <div class="right-panel">
        <div class="panel-header">
            <div class="panel-icon"></div>
            <div class="panel-title">预报预警</div>
            <div class="panel-subtitle">Early warning</div>
        </div>

        <div style="width: 150%;position: absolute;right: -125%;top: 4%;">
            <button  id="myButton" class="btn1" ">开闸泄洪
                <span id="information">(状态：关闭)</span>
                <div class="tech-border">
                    <div class="tech-corner corner-tl"></div>
                    <div class="tech-corner corner-tr"></div>
                    <div class="tech-corner corner-bl"></div>
                    <div class="tech-corner corner-br"></div>
                </div>
            </button>
        </div>
        <hr
            style="width: 100%;height: 2px;border-color: rgb(166, 207, 243);position: absolute;top: 13%;background-color: rgb(166, 207, 243);" />

        <!-- 原有的预警等级图标区域 - 完全保留，不做任何删除 -->
        <div>
            <div id="warningContainer">
                <div class="imgF" id="greenWarning">
                    <img src="/imagesT/绿色预警.png" style="position: absolute;right: 0%;top: 14%;">
                    <p style="position: absolute;right: 14%;top: 24%;font-size: 15px;">-安全水位-</p>
                </div>
                <div class="imgF" id="blueWarning">
                    <img src="/imagesT/蓝色预警.png" style="position: absolute;right: 0%;top: 14%;">
                    <p style="position: absolute;right: 15.5%;top: 24%;font-size: 15px;">蓝色预警</p>
                </div>
                <div class="imgF" id="yellowWarning">
                    <img src="/imagesT/黄色预警.png" style="position: absolute;right: 0%;top: 14%;">
                    <p style="position: absolute;right: 15.5%;top: 24%;font-size: 15px;">黄色预警</p>
                   
                </div>
                <div class="imgF" id="orangeWarning">
                    <img src="/imagesT/橙色预警.png" style="position: absolute;right: 0%;top: 14%;">
                    <p style="position: absolute;right: 15.5%;top: 24%;font-size: 15px;">橙色预警</p>
                </div>
                <div class="imgF" id="redWarning">
                    <img src="/imagesT/红色预警.png" style="position: absolute;right: 0%;top: 14%;">
                    <p style="position: absolute;right: 15.5%;top: 24%;font-size: 15px;">红色预警</p>
                </div>
            </div>
        </div>

        <!-- 预测水位容器（保持不变） -->
        <div id="green">
            <img src="/imagesT/绿.png" style="width: 50%;height: 17%;position: absolute;top: 14%;">
            <div style="position: absolute;top: 21%;color: rgb(255, 255, 255);left: 15%;">
                <p>
                <p>&nbsp;</p>预测水位</p>
                <p id="forecastFont01"
                    style="font-weight: 700;position: absolute;left: 25%;top: -40%;font-size: xx-large;">20</p>
            </div>
        </div>
        <div id="blue">
            <img src="/imagesT/蓝.png" style="width: 50%;height: 17%;position: absolute;top: 14%;">
            <div style="position: absolute;top: 21%;color: rgb(255, 255, 255);left: 15%;">
                <p>
                <p>&nbsp;</p>预测水位</p>
                <p id="forecastFont02"
                    style="font-weight: 700;position: absolute;left: 25%;top: -40%;font-size: xx-large;">20</p>
            </div>
        </div>
        <div id="yellow">
            <img src="/imagesT/黄.png" style="width: 50%;height: 17%;position: absolute;top: 14%;">
            <div style="position: absolute;top: 21%;color: rgb(255, 255, 255);left: 15%;">
                <p>
                <p>&nbsp;</p>预测水位</p>
                <p id="forecastFont03"
                    style="font-weight: 700;position: absolute;left: 25%;top: -40%;font-size: xx-large;">20</p>
            </div>
        </div>
        <div class="orange" id="orange">
            <img src="/imagesT/橙.png" style="width: 50%;height: 17%;position: absolute;top: 14%;">
            <div style="position: absolute;top: 21%;color: rgb(255, 255, 255);left: 15%;">
                <p>
                <p>&nbsp;</p>预测水位</p>
                <p id="forecastFont04"
                    style="font-weight: 700;position: absolute;left: 25%;top: -40%;font-size: xx-large;">20</p>
            </div>
        </div>
        <div class="red" id="red">
            <img src="/imagesT/红.png" style="width: 50%;height: 17%;position: absolute;top: 14%;">
            <div style="position: absolute;top: 21%;color: rgb(255, 255, 255);left: 15%;">
                <p>
                <p>&nbsp;</p>预测水位</p>
                <p id="forecastFont05"
                    style="font-weight: 900;position: absolute;left: 25%;top: -40%;font-size: xx-large;">20</p>
            </div>
        </div>

        <div style="width: 100%;position: absolute;top: 30%;">
            <div class="panel-header">
                <div class="panel-icon"></div>
                <div class="panel-title">预案</div>
                <div class="panel-subtitle">Generic plan</div>
            </div>
        </div>
        <div style="position: relative;top: 22%;">
            <img src="/imagesT/预案文稿初始.png"
                style="width: 100%; position: absolute; top: 29.5%; right: 3%; cursor: pointer;" />
            <div id="textContainer" style="position: absolute; 
            top: 35%; 
            right: 3%; 
            width: 90%; 
            height: 60%; 
            color: #ffffff; 
            font-size: 18px; 
            line-height: 1.2; 
            letter-spacing: -0.5px;  
            padding: 20px; 
            display: none;
            white-space: pre-wrap; 
            word-break: break-all;
            font-size: 15px; "></div>
        </div>
    </div>`
const warning_import = `
<script src="/js/apiUtils.js"></script>
<script src="/js/ajax.js"></script>
<script src="/js/water_level_rt_data1.js"></script>
<script src="/js/echarts.js"></script>
<script src="/js/water_level_rt_chart copy.js"></script>
<script src="/js/warning1.js"></script>
<script>
    // 预案文稿点击事件（保持不变）
    document.addEventListener('DOMContentLoaded', function () {
        const img = document.querySelector('img[src="/imagesT/预案文稿初始.png"]');
        const textContainer = document.getElementById('textContainer');
        let isOriginal = true;
        let typingInterval;

        const fullText = \`
        \\n
        \\n

        关于启动洪水黄色预警响应的紧急通知
各乡(镇)人民政府、市直有关单位:
根据气象部门监测，未来我市将出现明显降雨过程，部分区域可能发生洪水，已达到洪水黄色预警标准。为切实做好防范应对工作，保障人民群众生命财产安全，现将有关事项通知如下:
一、立即启动预警响应
各单位要迅速进入应急状态，严格落实24小时值班和领导带班制度，确保通信畅通、信息及时传递。
二、强化重点区域防控
住建部门要对城市低洼地段、地下车库等易积水区域进行排查，提前做好排水设施检修和排水准备。
各乡镇要组织力量对低洼地带、地质灾害隐患点的群众进行排查，必要时及时组织转移。
四、加强信息报送工作
各单位要及时收集、汇总相关信息，按照规定时限向市应急指挥中心报送。\`;

        function typeWriter(text, i, element) {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                typingInterval = setTimeout(() => typeWriter(text, i, element), 50);
            }
        }

        if (img) {
            img.addEventListener('click', function () {
                if (isOriginal) {
                    this.src = '/imagesT/预案文稿底.png';
                    textContainer.style.display = 'block';
                    typeWriter(fullText, 0, textContainer);
                } else {
                    this.src = '/imagesT/预案文稿初始.png';
                    textContainer.style.display = 'none';
                    clearTimeout(typingInterval);
                    textContainer.innerHTML = '';
                }
                isOriginal = !isOriginal;
            });
        }
    });

    // 视频放大功能（保持不变）
    document.addEventListener('DOMContentLoaded', function () {
        const videos = document.querySelectorAll('.video');
        const enlargedContainer = document.createElement('div');
        enlargedContainer.style.cssText = \`
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, 100%);
        background: black;
        transition: transform 0.3s ease;
        z-index: 1000;
        display: none;
        overflow: hidden;
    \`;
        document.body.appendChild(enlargedContainer);

        const enlargedVideo = document.createElement('video');
        enlargedVideo.controls = true;
        enlargedVideo.style.width = '100%';
        enlargedVideo.style.height = '100%';
        enlargedVideo.loop = true;
        enlargedContainer.appendChild(enlargedVideo);

        videos.forEach(video => {
            video.addEventListener('click', function () {
                if (enlargedContainer.style.display === 'block' &&
                    enlargedVideo.src === this.src) {
                    enlargedContainer.style.transform = 'translate(-50%, 100%)';
                    setTimeout(() => {
                        enlargedContainer.style.display = 'none';
                    }, 300);
                    this.play();
                } else {
                    enlargedVideo.src = this.src;
                    enlargedVideo.currentTime = this.currentTime;
                    if (!this.paused) enlargedVideo.play();
                    this.pause();

                    enlargedContainer.style.display = 'block';
                    setTimeout(() => {
                        enlargedContainer.style.transform = 'translate(-50%, -50%)';
                    }, 10);
                }
            });
        });

        document.addEventListener('click', function (e) {
            if (enlargedContainer.style.display === 'block' &&
                !enlargedContainer.contains(e.target) &&
                ![...videos].some(v => v === e.target)) {
                enlargedContainer.style.transform = 'translate(-50%, 100%)';
                setTimeout(() => {
                    enlargedContainer.style.display = 'none';
                    videos.forEach(v => {
                        if (v.src === enlargedVideo.src) v.play();
                    });
                }, 300);
            }
        });
    });

    // 开闸泄洪函数
    function turn() {
        var btn = document.getElementById("myButton");
        var infoSpan = document.getElementById("information");
        if (infoSpan && infoSpan.innerText.includes("关闭")) {
            infoSpan.innerText = "(状态：开启)";
        } else if (infoSpan) {
            infoSpan.innerText = "(状态：关闭)";
        }
    }
</script>
<script src="/js/update_time.js"></script>
`;