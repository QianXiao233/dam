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
        
        // 隐藏所有预警图标和预测水位
        {
            document.getElementById('blueWarning').style.display = 'none';
            document.getElementById('yellowWarning').style.display = 'none';
            document.getElementById('orangeWarning').style.display = 'none';
            document.getElementById('redWarning').style.display = 'none';

            document.getElementById('blue').style.display = 'none';
            document.getElementById('yellow').style.display = 'none';
            document.getElementById('orange').style.display = 'none';
            document.getElementById('red').style.display = 'none';
        }

        // 水位等级判断
        if (value < 50) {
            // 死水位 - 黑色
            document.getElementById('redWarning').style.display = 'block';
            document.getElementById('red').style.display = 'block';
            document.getElementById('forecastFont05').innerHTML = value;
            showTopCard(topBlackCard);
        } else if (value >= 50 && value < 56) {
            // 濒死水位 - 灰色
            document.getElementById('orangeWarning').style.display = 'block';
            document.getElementById('orange').style.display = 'block';
            document.getElementById('forecastFont04').innerHTML = value;
            showTopCard(topGrayCard);
        } else if (value >= 56 && value < 80) {
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
            document.getElementById('orange').style.display = 'block';
            document.getElementById('forecastFont04').innerHTML = value;
            showTopCard(topOrangeCard);
        } else if (value >= 130) {
            document.getElementById('redWarning').style.display = 'block';
            document.getElementById('red').style.display = 'block';
            document.getElementById('forecastFont05').innerHTML = value;
            showTopCard(topRedCard);
        }
    }