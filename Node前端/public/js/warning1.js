      // 获取顶部悬浮预警卡片元素
    const topRedCard = document.getElementById('topRedCard');
    const topOrangeCard = document.getElementById('topOrangeCard');
    const topYellowCard = document.getElementById('topYellowCard');
    const topGreenCard = document.getElementById('topGreenCard');
    const topBlueCard = document.getElementById('topBlueCard');
    // 辅助函数：隐藏所有顶部预警卡片
    function hideAllTopCards() {
        if (topRedCard) topRedCard.classList.add('hidden');
        if (topOrangeCard) topOrangeCard.classList.add('hidden');
        if (topYellowCard) topYellowCard.classList.add('hidden');
        if (topGreenCard) topGreenCard.classList.add('hidden');
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
        
        // 原有的预警图标和预测水位显示逻辑（完全保留）
        if (1==1) {
            document.getElementById('greenWarning').style.display = 'none';
            document.getElementById('blueWarning').style.display = 'none';
            document.getElementById('yellowWarning').style.display = 'none';
            document.getElementById('orangeWarning').style.display = 'none';
            document.getElementById('redWarning').style.display = 'none';
            //document.getElementById('yellowInformation').style.display = 'none';
            //document.getElementById('orangeIformation').style.display = 'none';

            document.getElementById('green').style.display = 'none';
            document.getElementById('blue').style.display = 'none';
            document.getElementById('yellow').style.display = 'none';
            document.getElementById('orange').style.display = 'none';
            document.getElementById('red').style.display = 'none';
        }

        // 水位等级判断 - 原有图标 + 顶部悬浮卡片同步显示
        if (value >= 0 && value < 50) {
            document.getElementById('greenWarning').style.display = 'block';
            document.getElementById('green').style.display = 'block';
            document.getElementById('forecastFont01').innerHTML = value;
            // 安全水位，不显示顶部预警卡片
            showTopCard(topGreenCard);
        } else if (value >= 50 && value < 80) {
            document.getElementById('blueWarning').style.display = 'block';
            document.getElementById('blue').style.display = 'block';
            document.getElementById('forecastFont02').innerHTML = value;
            showTopCard(topBlueCard);
             //蓝色预警，不显示顶部红橙黄卡片
        } else if (value >= 80 && value < 110) {
            document.getElementById('yellowWarning').style.display = 'block';
            document.getElementById('yellow').style.display = 'block';
            document.getElementById('forecastFont03').innerHTML = value;
            //document.getElementById('yellowInformation').style.display = 'block';
            // 显示顶部黄色预警卡片
            showTopCard(topYellowCard);
        } else if (value >= 110 && value < 130) {
            document.getElementById('orangeWarning').style.display = 'block';
            document.getElementById('orange').style.display = 'block';
            document.getElementById('forecastFont04').innerHTML = value;
            //document.getElementById('orangeIformation').style.display = 'block';
            // 显示顶部橙色预警卡片
            showTopCard(topOrangeCard);
        } else if (value >= 130) {
            document.getElementById('redWarning').style.display = 'block';
            document.getElementById('red').style.display = 'block';
            document.getElementById('forecastFont05').innerHTML = value;
            // 显示顶部红色预警卡片
            showTopCard(topRedCard);
        }
    }