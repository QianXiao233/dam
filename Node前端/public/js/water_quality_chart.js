document.getElementById('waterQualityChart').innerHTML = `
                    <table class="quality-table">
                        <thead>
                            <tr>
                                <th>指标类型</th>
                                <th>数值</th>
                                <th>单位</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>土壤湿度</td>
                                <td id="soilhumidity">等待数据同步</td>
                                <td>%</td>
                            </tr>
                            <tr>
                                <td>震动采样值</td>
                                <td id="shake">等待数据同步</td>
                                <td></td>
                            </tr>
                            <tr>
                                <td>水泵状态</td>
                                <td id="zhuangtai">等待数据同步</td>
                            </tr>
                            <tr>
                                <td>浊度</td>
                                <td id="zhuodu">等待数据同步</td>
                                <td>mg/l</td>
                            </tr>
                        </tbody>
                    </table>
`;

window.getWaterQualityChart=function getWaterQualityChart() {
    let value = window.getData();
    document.getElementById('zhuodu').textContent = value[0][1];
    document.getElementById('soilhumidity').textContent = value[0][3];
    document.getElementById('shake').textContent = value[0][2];
    console.log("水泵状态"+value[0][5]);
    if (value[0][5] == 1) {
        document.getElementById('zhuangtai').textContent = '开启';
    }else if (value[0][5] == 0) {
        document.getElementById('zhuangtai').textContent = '关闭';
    }
}
function getWaterControllerValue() {
    let value1 = window.getData();
    console.log("水泵状态"+value1[0][5]);
    if (value1[0][5] == 1) {
        document.getElementById('zhuangtai').textContent = '开启';
    }else if (value1[0][5] == 0) {
        document.getElementById('zhuangtai').textContent = '关闭';
    }
}
