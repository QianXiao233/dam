// 初始化图表
const myChart_gauge_1 = echarts.init(document.getElementById('gauge1'));
// 更新图表
function gauge(value, title, unit) {

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
                    offsetCenter: [0, 5],
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
                    show: false,
                    fontSize: 1
                },
                radius: '100%',
                pointer: {
                    show: false,
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

//gauge(10,'山体位移','度')

// 初始化图表
const myChart_gauge_2 = echarts.init(document.getElementById('gauge2'));
// 初始化坝体震动监测图表
myChart_gauge_2.setOption(gauge(30, '土壤湿度', '度'));

myChart_gauge_1.setOption(gauge(0, '山体位移', '度'));

window.addEventListener('resize', function () {
    myChart_gauge_1.resize();
    myChart_gauge_2.resize();
});

window.updateGaugeChart=function(){
    let newdata = window.getData();
    let newSoildData = newdata[0][3] / 100;
    if (!Number.isNaN(newSoildData)) {
        myChart_gauge_2.setOption(gauge(newSoildData, '土壤湿度', '度'));
        myChart_gauge_1.setOption(gauge(newdata[0][4], '山体位移', '度'));
    }
}
//定时更新土壤湿度
// setInterval(function () {
//     let newdata = window.getData();
//     let newSoildData = newdata[0][3] / 100;
//     if (!Number.isNaN(newSoildData)) {
//         myChart_gauge_2.setOption(gauge(newSoildData, '土壤湿度', '度'));
//         myChart_gauge_1.setOption(gauge(newdata[0][4], '山体位移', '度'));
//     }
// }
//     , 1000);
