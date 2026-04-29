function getweather() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'https://p76appu7my.re.qweatherapi.com/v7/weather/now?location=101120501', true);
    xhr.setRequestHeader("X-QW-Api-Key", "d8607873c02d42cc85866c76624adfa0");
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                updateweather(data);
            } else {
                console.error('请求失败，状态码：', xhr.status);
            }
        }
    };
    
    xhr.send();
}

function updateweather(data) {
    if (data.code === "200") {
        // 只提取需要的字段：风力、降水量、温度、湿度
        var windScale = data.now.windScale;   // 风力等级
        var precip = data.now.precip;         // 降水量
        var temp = data.now.temp;             // 温度
        var humidity = data.now.humidity;     // 湿度
        var windDir = data.now.windDir;       // 风向（修正字段名）
        var cond = data.now.text;             // 天气状况
        
        // 修正：innerText 是属性，不是方法
        document.getElementById("condition").innerText = cond;
        document.getElementById("fengli").innerText = windDir + windScale + "级";
        document.getElementById("shuiliang").innerText = precip + "mm";
        document.getElementById("temperature").innerText = temp + "°C";
        document.getElementById("humandity").innerText = humidity + "%";
        
        // 可选：在控制台输出确认
        console.log('天气更新成功：', cond, temp + '°C');
    } else {
        console.error('天气数据获取失败，错误码：', data.code);
    }
}

// 调用获取天气（注意：只需要调用这一个函数）
getweather();