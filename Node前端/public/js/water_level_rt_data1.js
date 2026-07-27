

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
    window.updatewaterLevelChart();
    window.updatewatermodel();
    window.waterController();
    window.receiveWarningValue();
    console.log("数据接收，已成功处理！");

};

