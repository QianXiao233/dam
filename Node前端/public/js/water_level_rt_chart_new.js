// Water Level Trend Chart —— 水位趋势图（修复版，供非 b 页面使用）
// 修复：y 轴自适应（不再固定 min:0，曲线不会压成平线）
// 修复：去掉初始 25 个占位假数据，从真实数据开始绘制
// 修复：数据校验兼容数字字符串，无效数据跳过（不会中断曲线）

const MAX_POINTS = 30; // 窗口内最多保留的数据点数

let yAxisData = [];
let timeLabels = [];

const waterLevelChart = echarts.init(document.getElementById('waterLevelChart'));
const waterLevelOption = {
    grid: { top: 15, right: 15, bottom: 20, left: 40 },
    tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 20, 50, 0.85)',
        borderColor: 'rgba(0, 200, 255, 0.4)',
        textStyle: { color: '#d8f3ff', fontSize: 11 },
        formatter: function (params) {
            if (!params.length) return '';
            const p = params[0];
            const v = p.value;
            return '时间：' + p.axisValue + '<br/>水位：' + (v === undefined || v === null || isNaN(v) ? '--' : Number(v).toFixed(1));
        }
    },
    xAxis: {
        type: 'category',
        data: timeLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 },
        axisTick: { show: false }
    },
    yAxis: {
        type: 'value',
        scale: true, // 让 y 轴跟随数据范围缩放（趋势更明显）
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(36,124,255, 0.2)' } }
    },
    series: [{
        data: yAxisData,
        type: 'line',
        smooth: true,
        connectNulls: true,
        lineStyle: { color: '#00d4ff', width: 2 },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: 'rgba(36,124,255, 1)' },
                    { offset: 1, color: 'rgba(36,124,255, 0.1)' }
                ]
            }
        },
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false
    }]
};
waterLevelChart.setOption(waterLevelOption);
window.waterLevelChart = waterLevelChart;

function isNonEmpty2DNumberArray(data) {
    // 检查是否为数组
    if (!Array.isArray(data)) {
        return false;
    }
    // 检查数组是否有元素
    if (data.length === 0) {
        return false;
    }
    // 第一项必须是数组且有元素，且首元素可转为有效数字（兼容数字字符串）
    if (!Array.isArray(data[0]) || data[0].length === 0) {
        return false;
    }
    const v = Number(data[0][0]);
    return typeof v === 'number' && !isNaN(v);
}

function formatTimeLabel() {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    const ss = now.getSeconds().toString().padStart(2, '0');
    return hh + ':' + mm + ':' + ss;
}

window.updatewaterLevelChart = function updatewaterLevelChart() {
    const data = window.getData();
    if (!isNonEmpty2DNumberArray(data)) {
        return;
    }
    const value = Number(data[0][0]);

    // 添加新数据点
    yAxisData.push(value);
    timeLabels.push(formatTimeLabel());

    // 超出窗口则滚动移除最旧的点
    if (yAxisData.length > MAX_POINTS) {
        yAxisData.shift();
        timeLabels.shift();
    }

    // 更新图表
    window.waterLevelChart.setOption({
        xAxis: {
            data: timeLabels
        },
        series: [{
            data: yAxisData
        }]
    });
};

// setInterval(updatewaterLevelChart, 1000);
// Responsive resize
window.addEventListener('resize', function () {
    waterLevelChart.resize();
});
