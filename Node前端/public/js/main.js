// Water Level Trend Chart
const waterLevelChart = echarts.init(document.getElementById('waterLevelChart'));
const waterLevelOption = {
    grid: { top: 10, right: 10, bottom: 20, left: 30 },
    xAxis: {
        type: 'category',
        data: ['01:00', '07:00', '07:00', '07:00', '07:00', '07:00', '07:00'],
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 }
    },
    yAxis: {
        type: 'value',
        min: 0,
        max: 250,
        axisLine: { lineStyle: { color: '#00d4ff' } },
        axisLabel: { color: '#a0c4ff', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(36,124,255, 0.2)' } }
    },
    series: [{
        data: [50, 80, 120, 180, 200, 220, 200],
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

// Forecast Chart
// const forecastChart = echarts.init(document.getElementById('forecastChart'));
// const forecastOption = {
//     grid: { top: 15, right: 15, bottom: 25, left: 35 },
//     legend: {
//         show: false,
//         top: 0,
//         textStyle: { color: '#a0c4ff', fontSize: 9 },
//         itemWidth: 12,
//         itemHeight: 8
//     },
//     xAxis: {
//         type: 'category',
//         data: ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'],
//         axisLine: { lineStyle: { color: '#00d4ff' } },
//         axisLabel: { color: '#a0c4ff', fontSize: 9 }
//     },
//     yAxis: {
//         type: 'value',
//         min: 120,
//         max: 200,
//         axisLine: { lineStyle: { color: '#00d4ff' } },
//         axisLabel: { color: '#a0c4ff', fontSize: 9 },
//         splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } }
//     },
//     series: [
//         {
//             name: '警戒水位',
//             data: [185, 188, 190, 192, 190, 187, 185],
//             type: 'line',
//             lineStyle: { color: '#ff4444', width: 2 },
//             symbol: 'circle',
//             symbolSize: 3,
//             itemStyle: { color: '#ff4444' }
//         },
//         {
//             name: '保证水位',
//             data: [175, 178, 180, 182, 180, 177, 175],
//             type: 'line',
//             lineStyle: { color: '#ff8800', width: 2 },
//             symbol: 'circle',
//             symbolSize: 3,
//             itemStyle: { color: '#ff8800' }
//         },
//         {
//             name: '汛限水位',
//             data: [165, 168, 170, 172, 170, 167, 165],
//             type: 'line',
//             lineStyle: { color: '#ffdd00', width: 2 },
//             symbol: 'circle',
//             symbolSize: 3,
//             itemStyle: { color: '#ffdd00' }
//         },
//         {
//             name: '正常水位',
//             data: [155, 158, 160, 162, 160, 157, 155],
//             type: 'line',
//             lineStyle: { color: '#0088ff', width: 2 },
//             symbol: 'circle',
//             symbolSize: 3,
//             itemStyle: { color: '#0088ff' }
//         }
//     ]
// };
// forecastChart.setOption(forecastOption);

// Vibration Chart
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
        max: 20,
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

// 初始化图表
const chartDom_gauge_1 = document.getElementById('gauge1');
const myChart_gauge_1 = echarts.init(chartDom_gauge_1);
// 更新图表
function gauge(value,title,unit) {

  let option_gauge;
   option_gauge = {
    tooltip: {

    },
    series: [
      {
        startAngle: 360,
        name: title,
        type: 'gauge',
        progress: {
          show: true,
          itemStyle: {
            color: '#8eb5f3'
          }
        },
        axisLine: {
          lineStyle: {
            color: [[1, '#60647c']]
          }
        },
        detail: {
          valueAnimation: true,
          offsetCenter:[0,5],
          formatter: function (value) {
            return '{valueStyle|' + value + '}' + '\n' + '{unitStyle|' + unit + '}';
          },
          rich: {
            valueStyle: {
              fontSize: 28,
              fontWeight: 'bold',
              color: '#ffffff',
              lineHeight: 34
            },
            unitStyle: {
              fontSize: 14,
              color: '#ffffff',
              padding: [-10, 0, 0, 0]
            }
          }
        },
        axisLabel: {
          show:false,
          fontSize:1
        },
        radius:'100%',
        pointer:{
          show:false,
        },
        data: [
          {
            value: value,
          }
        ]
      }
    ]
  };
  //myChart_gauge_1.setOption(option_gauge);
  return option_gauge;
}


// 初始化坝体震动监测图表
myChart_gauge_1.setOption(gauge(10,'山体位移','度'));
//gauge(10,'山体位移','度')

// 初始化图表
const chartDom_gauge_2 = document.getElementById('gauge2');
const myChart_gauge_2 = echarts.init(chartDom_gauge_2);
// 初始化坝体震动监测图表
myChart_gauge_2.setOption(gauge(30,'土壤湿度','度'));

// 初始化图表
document.addEventListener('DOMContentLoaded', function() {
// 实时更新时间
  function updateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    document.querySelector('.text-lg.font-mono').textContent = timeString;
  }

  // 初始更新时间并设置定时器
  updateTime();
  setInterval(updateTime, 1000);
})

// 实时时间更新功能
function updateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const timeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    document.getElementById('currentTime').textContent = timeString;
}

// 页面加载时立即更新时间，然后每秒更新一次
updateTime();
setInterval(updateTime, 1000);

// Responsive resize
window.addEventListener('resize', function () {
    waterLevelChart.resize();
    forecastChart.resize();
    vibrationChart.resize();
    myChart_gauge_1.resize();
    myChart_gauge_2.resize();
});

// 动态设置 trapezoid-content 高度
function updateTrapezoidHeight() {
    // 获取当前水位值（从 trapezoid-line-text 中获取）
    const waterLevelText = document.querySelector('.trapezoid-line-text');
    const currentWaterLevel = parseFloat(waterLevelText.textContent.trim()) || 150;
    
    // 设置最大水位值（可以根据需要调整）
    const maxWaterLevel = 200;
    
    // 计算百分比
    const percentage = Math.min((currentWaterLevel / maxWaterLevel) * 100, 100);
    
    // 获取 trapezoid-content 元素
    const trapezoidContent = document.querySelector('.trapezoid-content');
    if (trapezoidContent) {
        // 设置高度为百分比
        trapezoidContent.style.height = percentage + '%';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    updateTrapezoidHeight();
    
    // 可以设置定时器来模拟实时更新
    setInterval(updateTrapezoidHeight, 5000); // 每5秒更新一次
});

// 也可以手动调用更新函数
// updateTrapezoidHeight();
