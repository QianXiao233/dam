
window.pre_data = function getPredictorData() {
    var xhr = new XMLHttpRequest();
    // 2. 配置请求
    xhr.open('GET', window.apiUrls.WATER_LP_URL, true);
    // 3. 设置回调函数
    xhr.onreadystatechange = function () {
        // 4. 检查响应状态
        if (xhr.status === 200) {
            // 5. 处理响应数据
            let data = xhr.responseText

            // 更新梯形高度
            window.updateTrapezoidHeight(data);
        }
    };
    // 6. 发送请求
    xhr.send();
}
