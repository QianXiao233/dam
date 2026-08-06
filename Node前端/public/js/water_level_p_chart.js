// 水位预测/梯形断面图（仅在有 trapezoid-container 元素的页面生效，如 driver_b.html）
// 修复：元素不存在时不报错（driver.html 等无该元素的页面也能正常加载）

(function () {
    'use strict';

    var container = document.getElementById('trapezoid-container');
    if (container) {
        container.innerHTML = `
                    <hr class="trapezoid-line trapezoid-line-red">
                    <hr class="trapezoid-line trapezoid-line-orange">
                    <hr class="trapezoid-line trapezoid-line-yellow">
                    <hr class="trapezoid-line trapezoid-line-blue">
                    <div class="trapezoid-line-text"> 
                        100
                    </div>
                    <div class="trapezoid-content"></div> 
                    <div class="trapezoid"></div>
`;
    }

    window.updateTrapezoidHeight = function updateTrapezoidHeight() {
        // 元素不存在（非本页面功能）时安全跳过
        var lineText = document.querySelector('.trapezoid-line-text');
        var trapezoidContent = document.querySelector('.trapezoid-content');
        if (!lineText || !trapezoidContent) return;

        // 获取当前水位值
        var waterLevel = window.getData()[1][0];
        console.log("实时水位数据：" + waterLevel);
        lineText.innerHTML = waterLevel;

        var currentWaterLevel = parseFloat(waterLevel);
        if (isNaN(currentWaterLevel)) return;

        // 最大水位值（可以根据需要调整）
        var maxWaterLevel = 200;
        // 计算百分比
        var percentage = Math.min((currentWaterLevel / maxWaterLevel) * 100, 100);
        trapezoidContent.style.height = percentage + '%';
    };
})();
