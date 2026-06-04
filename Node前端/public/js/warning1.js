// 获取顶部悬浮预警卡片元素
const topRedCard = document.getElementById('topRedCard');
const topOrangeCard = document.getElementById('topOrangeCard');
const topYellowCard = document.getElementById('topYellowCard');
const topBlueCard = document.getElementById('topBlueCard');
const topGrayCard = document.getElementById('topGrayCard');
const topBlackCard = document.getElementById('topBlackCard');

// 辅助函数：隐藏所有顶部预警卡片
function hideAllTopCards() {
    if (topRedCard) topRedCard.classList.add('hidden');
    if (topOrangeCard) topOrangeCard.classList.add('hidden');
    if (topYellowCard) topYellowCard.classList.add('hidden');
    if (topGrayCard) topGrayCard.classList.add('hidden');
    if (topBlackCard) topBlackCard.classList.add('hidden');
    if (topBlueCard) topBlueCard.classList.add('hidden');
}

// 显示指定顶部预警卡片
function showTopCard(card) {
    if (card) card.classList.remove('hidden');
}

// 页面加载时默认隐藏所有预警图标和预测水位块（数据到之前不显示）
function hideAllWarnings() {
    var ids = ['blueWarning','yellowWarning','orangeWarning','redWarning',
               'blue','yellow','orange','red'];
    for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) el.style.display = 'none';
    }
}
hideAllWarnings();

// receiveWarningValue 函数：同时控制原有的预警图标 + 新增的顶部悬浮卡片
window.receiveWarningValue = function() {
    try {
        var data = window.getData();
        if (!data || !data[0] || data[0][0] === undefined || data[0][0] === null) return;
    } catch(e) {
        return; // 数据未就绪，不处理
    }

    var value = parseInt(data[0][0]);
    if (isNaN(value)) return;

    // 隐藏所有顶部悬浮卡片
    hideAllTopCards();

    // 隐藏所有预警图标和预测水位
    var hideIds = ['blueWarning','yellowWarning','orangeWarning','redWarning',
                   'blue','yellow','orange','red'];
    for (var i = 0; i < hideIds.length; i++) {
        var el = document.getElementById(hideIds[i]);
        if (el) el.style.display = 'none';
    }

    // 重置图片文字为默认
    var ow = document.getElementById('orangeWarning');
    if (ow) { var p = ow.querySelector('p'); if (p) p.textContent = '橙色预警'; }
    var rw = document.getElementById('redWarning');
    if (rw) { var p = rw.querySelector('p'); if (p) p.textContent = '红色预警'; }
    var ol = document.getElementById('orangeLabel');
    if (ol) ol.textContent = '预测水位';
    var rl = document.getElementById('redLabel');
    if (rl) rl.textContent = '预测水位';

    // 水位等级判断（改前: value < 50 不包含50，导致水位=50时错误显示濒死）
    // 修复: value < 50 → value <= 50; 其余分支保持原样
    if (value <= 50) {
        // 死水位 - 黑色（复用红色预警图片，改文字）
        var rw = document.getElementById('redWarning');
        if (rw) { rw.style.display = 'block'; var p = rw.querySelector('p'); if (p) p.textContent = '死水位'; }
        var r = document.getElementById('red');
        if (r) { r.style.display = 'block'; }
        var rl = document.getElementById('redLabel');
        if (rl) rl.textContent = '死水位';
        var f5 = document.getElementById('forecastFont05');
        if (f5) f5.innerHTML = value;
        showTopCard(topBlackCard);
    } else if (value >= 50 && value < 56) {
        // 濒死水位 - 灰色（复用橙色预警图片，改文字）
        var ow = document.getElementById('orangeWarning');
        if (ow) { ow.style.display = 'block'; var p = ow.querySelector('p'); if (p) p.textContent = '濒死水位'; }
        var o = document.getElementById('orange');
        if (o) { o.style.display = 'block'; }
        var ol = document.getElementById('orangeLabel');
        if (ol) ol.textContent = '濒死水位';
        var f4 = document.getElementById('forecastFont04');
        if (f4) f4.innerHTML = value;
        showTopCard(topGrayCard);
    } else if (value >= 56 && value < 80) {
        var bw = document.getElementById('blueWarning');
        if (bw) { bw.style.display = 'block'; var p = bw.querySelector('p'); if (p) p.textContent = '正常'; }
        var b = document.getElementById('blue');
        if (b) { b.style.display = 'block'; }
        var f2 = document.getElementById('forecastFont02');
        if (f2) f2.innerHTML = value;
        showTopCard(topBlueCard);
    } else if (value >= 80 && value < 110) {
        var yw = document.getElementById('yellowWarning');
        if (yw) { yw.style.display = 'block'; var p = yw.querySelector('p'); if (p) p.textContent = '预警'; }
        var y = document.getElementById('yellow');
        if (y) { y.style.display = 'block'; }
        var f3 = document.getElementById('forecastFont03');
        if (f3) f3.innerHTML = value;
        showTopCard(topYellowCard);
    } else if (value >= 110 && value < 130) {
        var ow = document.getElementById('orangeWarning');
        if (ow) { ow.style.display = 'block'; var p = ow.querySelector('p'); if (p) p.textContent = '橙色预警'; }
        var o = document.getElementById('orange');
        if (o) { o.style.display = 'block'; }
        var ol = document.getElementById('orangeLabel');
        if (ol) ol.textContent = '预测水位';
        var f4 = document.getElementById('forecastFont04');
        if (f4) f4.innerHTML = value;
        showTopCard(topOrangeCard);
    } else if (value >= 130) {
        var rw = document.getElementById('redWarning');
        if (rw) { rw.style.display = 'block'; var p = rw.querySelector('p'); if (p) p.textContent = '红色预警'; }
        var r = document.getElementById('red');
        if (r) { r.style.display = 'block'; }
        var rl = document.getElementById('redLabel');
        if (rl) rl.textContent = '预测水位';
        var f5 = document.getElementById('forecastFont05');
        if (f5) f5.innerHTML = value;
        showTopCard(topRedCard);
    }
}
