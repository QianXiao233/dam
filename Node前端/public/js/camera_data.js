const imgElement = document.getElementById("camera-item-01");
if (imgElement) {
    imgElement.crossOrigin = "anonymous";
    imgElement.src = window.apiUrls.VEDIO_URL+"/0";
    imgElement.onload = function () {
        console.log("监控接入成功");
    };
}


//更新监控画面的时间
setInterval(function () {
    const labelElement = document.getElementById("camera-label-01");
    if (labelElement) {
        labelElement.innerHTML = "监控画面" + window.updateTime();
    }
}, 1000)

