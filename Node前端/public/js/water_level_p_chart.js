document.getElementById('trapezoid-container').innerHTML =`
                   
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

window.updateTrapezoidHeight=function updateTrapezoidHeight() {
    // 获取当前水位值（从 trapezoid-line-text 中获取）
    const waterLevel= window.getData()[1][0];
    console.log("实时水位数据："+waterLevel)
    const waterLevelText = document.querySelector('.trapezoid-line-text').innerHTML = waterLevel;
    const currentWaterLevel =  parseFloat(waterLevel);
    waterLevelText.textContent = waterLevel;
    
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

