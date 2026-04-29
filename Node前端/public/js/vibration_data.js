var xAxisData2 = [];
var yAxisData2 = [];
// 初始化echarts配置项
var vibrationOption2 = {
    animation: false,
    grid: { top: 10, right: 0, bottom: 40, left: 30 },
    tooltip: { trigger: 'axis', axisPointer: { lineStyle: { color: 'white' } } },
    legend: { top: '10', textStyle: { color: "#fff" }, itemGap: 10, },
    xAxis: [{
        type: 'category', boundaryGap: false, axisLabel: { show: true, textStyle: { color: '#fff' } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,.1)' } },
        data: xAxisData2
    }],
    yAxis: [{
        type:'value',min:700,max:1300,
        axisLabel: { show: true, textStyle: { color: '#fff' } },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,.1)' } }
    }],
    series: [{
        type: 'line', smooth: true, symbol: 'circle', symbolSize: 5, showSymbol: false,
        lineStyle: { width: 2 },
        areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                offset: 0,
                color: 'rgba(24, 163, 64, 0.3)'
            }, { offset: 0.8, color: 'rgba(24, 163, 64, 0)' }], false),
            shadowColor: 'rgba(0, 0, 0, 0.1)', shadowBlur: 10
        },
        itemStyle: { color: '#1f6afeff', borderColor: 'rgba(137,189,2,0.27)', borderWidth: 12 },
        data: yAxisData2
    }]
};

// 设置初始数据
for (var i = 100; i > 0; i--) {
    xAxisData2.push(" ");
    yAxisData2.push(0); // 初始化为0或者其他默认值
}
// 更新图表方法
window.updateVibrationChart= function updateVibrationChart() {
    let newdata = window.getData()[0][2];
    // 移除第一个元素
    yAxisData2.shift();
    // 添加新数据到末尾
    yAxisData2.push(newdata);
    // 更新echarts图表
    window.vibrationChart.setOption(vibrationOption2);
}

// setInterval(updateVibrationChart, 500); // 每秒更新一次

