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

    // 修改 receiveWarningValue 函数：同时控制原有的预警图标 + 新增的顶部悬浮卡片
    window.receiveWarningValue = function() {
        var value = parseInt(window.getData()[0][0]);     
        // 隐藏所有顶部悬浮卡片
        hideAllTopCards();
        
        // 隐藏所有预警图标和预测水位，重置标签文字
        {
            document.getElementById('blueWarning').style.display = 'none';
            document.getElementById('yellowWarning').style.display = 'none';
            document.getElementById('orangeWarning').style.display = 'none';
            document.getElementById('redWarning').style.display = 'none';

            document.getElementById('blue').style.display = 'none';
            document.getElementById('yellow').style.display = 'none';
            document.getElementById('orange').style.display = 'none';
            document.getElementById('red').style.display = 'none';

            // 重置图片文字为默认
            var ow = document.getElementById('orangeWarning').querySelector('p');
            if (ow) ow.textContent = '橙色预警';
            var rw = document.getElementById('redWarning').querySelector('p');
            if (rw) rw.textContent = '红色预警';
            var ol = document.getElementById('orangeLabel');
            if (ol) ol.textContent = '预测水位';
            var rl = document.getElementById('redLabel');
            if (rl) rl.textContent = '预测水位';
        }

        // 水位等级判断（与后端Python保持一致）
        //   死水位: ≤50 (Python: WATER_DEAD=50)
        //   濒死:  50< x ≤55 (Python: WATER_CRITICAL=55)
        //   正常:  55< x <80 (Python: WATER_NORMAL_HIGH=80)
        //   预警:  80≤ x <110 (Python: WATER_WARNING=80, WARNING_HIGH=110)
        //   橙色预警: 110≤ x <130
        //   红色预警: ≥130
        if (value <= 50) {
            // 死水位 - 黑色
            document.getElementById('redWarning').style.display = 'block';
            document.getElementById('redWarning').querySelector('p').textContent = '死水位';
            document.getElementById('red').style.display = 'block';
            document.getElementById('redLabel').textContent = '死水位';
            document.getElementById('forecastFont05').innerHTML = value;
            showTopCard(topBlackCard);
        } else if (value > 50 && value <= 55) {
            // 濒死水位 - 灰色
            document.getElementById('orangeWarning').style.display = 'block';
            document.getElementById('orangeWarning').querySelector('p').textContent = '濒死水位';
            document.getElementById('orange').style.display = 'block';
            document.getElementById('orangeLabel').textContent = '濒死水位';
            document.getElementById('forecastFont04').innerHTML = value;
            showTopCard(topGrayCard);
        } else if (value > 55 && value < 80) {
            document.getElementById('blueWarning').style.display = 'block';
            document.getElementById('blue').style.display = 'block';
            document.getElementById('forecastFont02').innerHTML = value;
            showTopCard(topBlueCard);
        } else if (value >= 80 && value < 110) {
            document.getElementById('yellowWarning').style.display = 'block';
            document.getElementById('yellow').style.display = 'block';
            document.getElementById('forecastFont03').innerHTML = value;
            showTopCard(topYellowCard);
        } else if (value >= 110 && value < 130) {
            document.getElementById('orangeWarning').style.display = 'block';
            document.getElementById('orangeWarning').querySelector('p').textContent = '橙色预警';
            document.getElementById('orange').style.display = 'block';
            document.getElementById('orangeLabel').textContent = '预测水位';
            document.getElementById('forecastFont04').innerHTML = value;
            showTopCard(topOrangeCard);
        } else if (value >= 130) {
            document.getElementById('redWarning').style.display = 'block';
            document.getElementById('redWarning').querySelector('p').textContent = '红色预警';
            document.getElementById('red').style.display = 'block';
            document.getElementById('redLabel').textContent = '预测水位';
            document.getElementById('forecastFont05').innerHTML = value;
            showTopCard(topRedCard);
        }
    }