document.getElementById('trapezoid-container').innerHTML = `
                   
                    <hr class="trapezoid-line trapezoid-line-red">
                    <hr class="trapezoid-line trapezoid-line-orange">
                    <hr class="trapezoid-line trapezoid-line-yellow">
                    <hr class="trapezoid-line trapezoid-line-blue">
                    <div class="trapezoid-line-text" id="trapezoidLineText"> 
                    1000
                    </div>
                    <div class="trapezoid-content"></div> 
                    <div class="trapezoid"></div>
`;


window.updateTrapezoidHeight = function updateTrapezoidHeight() {
    const value = window.get_p_Data();
    const waterLevelText = document.querySelector('.trapezoid-line-text').innerHTML = value;
    // 获取当前水位值（从 trapezoid-line-text 中获取）
    const currentWaterLevel = parseFloat(waterLevelText.textContent.trim()) || value;
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
document.addEventListener('DOMContentLoaded', function () {
    updateTrapezoidHeight();
    // 可以设置定时器来模拟实时更新
    // setInterval(updateTrapezoidHeight, 5000); // 每5秒更新一次
});
