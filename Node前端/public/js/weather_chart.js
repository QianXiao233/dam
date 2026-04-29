const targetElement = document.getElementById('weather-grid');
// 要插入的HTML内容
const htmlToInsert = `
                    <div>
                        <div class="weather-item">
                            <div class="weather-label">天气</div>
                            <div class="weather-value" id="condition">晴</div>
                        </div>
                        <div class="weather-item">
                            <div class="weather-label">风力</div>
                            <div class="weather-value" id="fengli">东南风3级</div>
                        </div>
                        <div class="weather-item">
                            <div class="weather-label">降水量</div>
                            <div class="weather-value" id="shuiliang">10mm</div>
                        </div>
                        <div class="weather-item">
                            <div class="weather-label">温度</div>
                            <div class="weather-value" id="temperature">17-18°C</div>
                        </div>
                        <div class="weather-item">
                            <div class="weather-label">湿度</div>
                            <div class="weather-value" id="humandity">16%</div>
                        </div>
                        
                    </div>
                    <div id="weather-image">
                        <img src="/images/weather-desc.png" alt="">
                    </div>
`;

// 在目标元素前面插入HTML
if (targetElement) {
    targetElement.innerHTML= htmlToInsert;
}