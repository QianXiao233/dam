// Water Level Trend Chart

let yAxisData = [50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50,50];
let timeLabels = ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'];

const waterLevelChart = echarts.init(document.getElementById('waterLevelChart'));
const waterLevelOption = {
    grid: { top: 10, right: 10, bottom: 20, left: 30 },
    xAxis: {
        type: 'category',
        data: timeLabels,
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 }
    },
    yAxis: {
        type: 'value',
        min: 0,
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(36,124,255, 0.2)' } }
    },
    series: [{
        data: yAxisData,
        type: 'line',
        smooth: true,
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
        symbolSize: 4
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

    // 检查每个元素是否为非空数组且元素都是数字
    return data.every(item => {
        // 子项必须是数组
        if (!Array.isArray(item)) {
            return false;
        }
        // 子数组必须有元素
        if (item.length === 0) {
            return false;
        }
        // 子数组的每个元素必须是数字且不是NaN
        return item.every(element => typeof element === 'number' && !isNaN(element));
    });
}

function updatewaterLevelChart() {
    let data = window.getData();
    console.log("实时数据:"+data)
    if (isNonEmpty2DNumberArray(data)) {
        yAxisData.shift();
        yAxisData.push(data[0][0]);
        // 更新时间标签
        const now = new Date();
        const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        timeLabels.shift();
        timeLabels.push(timeStr);
        // 更新图表
        window.waterLevelChart.setOption({
            xAxis: {
                data: timeLabels
            },
            series: [{
                data: yAxisData
            }]
        });
    }
}

// setInterval(updatewaterLevelChart, 1000);
// Responsive resize
window.addEventListener('resize', function () {
    waterLevelChart.resize();
});
