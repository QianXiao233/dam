const socket = new WebSocket('ws://localhost:8080/websocket');

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

var data = null;
var isDataReady = false;  // 添加数据就绪标志

socket.onmessage = function (event) {
    try {
        // 存储原始数据
        data = event.data;
        console.log('收到原始数据:', data);
        
        // 验证数据格式
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length >= 2) {
            isDataReady = true;
            console.log('数据解析成功:', parsed);
            
            // 可选：数据准备好后触发自定义事件
            window.dispatchEvent(new CustomEvent('dataReady', { detail: parsed }));
        } else {
            console.warn('数据格式不正确:', parsed);
            isDataReady = false;
        }
    } catch (e) {
        console.error('解析数据失败:', e, '原始数据:', data);
        isDataReady = false;
    }
};

// 改进 getData 函数，添加安全检查
window.getData = function () {
    // 检查数据是否为空
    if (!data) {
        console.warn('getData: 数据尚未接收，返回空数组');
        return [];  // 返回空数组而不是 null
    }
    
    // 检查数据是否已就绪
    if (!isDataReady) {
        console.warn('getData: 数据未就绪');
        return [];
    }
    
    try {
        let data1 = JSON.parse(data);
        // 确保返回的是数组格式
        if (!Array.isArray(data1)) {
            console.error('getData: 解析结果不是数组', data1);
            return [];
        }
        return data1;
    } catch (e) {
        console.error('getData: JSON解析失败', e);
        return [];
    }
};

// 添加一个安全的数据获取方法
window.getSafeData = function () {
    if (!isDataReady || !data) {
        return null;
    }
    try {
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};