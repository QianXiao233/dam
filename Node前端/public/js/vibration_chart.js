
const vibrationChart = echarts.init(document.getElementById('vibrationChart'));
const vibrationOption = {
    grid: { top: 5, right: 10, bottom: 15, left: 20 },
    xAxis: {
        type: 'category',
        data: ['1-2月', '1-3月', '1-4月', '1-5月', '1-6月'],
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 9 }
    },
    yAxis: {
        type: 'value',
        max: 2000,
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 9 },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } }
    },
    series: [{
        data: [8, 12, 15, 10, 5],
        type: 'line',
        smooth: true,
        lineStyle: { color: '#00d4ff', width: 2 },
        areaStyle: {
            color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                    { offset: 0, color: 'rgba(0, 212, 255, 0.6)' },
                    { offset: 1, color: 'rgba(0, 212, 255, 0.1)' }
                ]
            }
        },
        symbol: 'circle',
        symbolSize: 3
    }]
};

vibrationChart.setOption(vibrationOption);
window.vibrationChart = vibrationChart;
// Responsive resize
window.addEventListener('resize', function () {
    vibrationChart.resize();
    
});
