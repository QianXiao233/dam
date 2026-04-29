const socket = new WebSocket(window.apiUrls.SOCKET_URL);
socket.onopen = function (event) {
    console.log('Connection established!');
};
socket.onerror = function (error) {
    console.error('WebSocket Error: ', error);
};
socket.onclose = function (event) {
    if (event.wasClean) {
        console.log(`Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
        console.error('Connection died');
    }
};

var data1 = null;
socket.onmessage = function (event) {
    // 接收并解析数据
    data1 = event.data;

    window.getData = function () {
        return JSON.parse(data1);
    };
    //接收数据后更新实时水位图表
    window.updatewaterLevelChart();
    //大坝震动检测
     window.updateVibrationChart();
    //浑浊度
    window.getWaterQualityChart();
    //位移、土壤湿度
    window.updateGaugeChart();
    //实时水位
    //window.updatewaterLevelChart();
    //
    window.updatewatermodel();

    // 实施预报信息
    // window.updateMessage()
    //更新水位控制
    // window.controller()
    //更新消息报警
    // window.controllerMessage()
    // //获取预测水位
    // window.pre_data()
    //  更新水位数据
     try {
        window.updateTrapezoidHeight();
        
     } catch (error) {
        console.log("预测水位数据暂未收到")
     }
     //window.waterController();
     //window.receiveWarningValue();
     console.log("数据接收，已成功处理！");

};

window.getData = function () {
    return JSON.parse(data1);
};

//绑定数据
// window.updatewaterLevelChart(window.getData());

