document.addEventListener('DOMContentLoaded', function () {
    const clickElement = document.querySelector('.l01');
    const videoContainer = document.getElementById('video-container');
    const videoPlayer = document.getElementById('video-player');

    clickElement.addEventListener('click', function () {
        // 切换视频容器的显示状态
        if (videoContainer.style.display === 'none' || videoContainer.style.display === '') {
            videoContainer.style.display = 'block';

            // 绘制矩形框效果
            const frame = document.getElementById('video-frame');
            frame.style.border = '3px solid #333';
            frame.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

            // 播放视频
            videoPlayer.play();
        } else {
            videoContainer.style.display = 'none';
            videoPlayer.pause();
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const clickElement = document.querySelector('.l02');
    const videoContainer1 = document.getElementById('video-container1');
    const videoPlayer1 = document.getElementById('video-player1');

    clickElement.addEventListener('click', function () {
        // 切换视频容器的显示状态
        if (videoContainer1.style.display === 'none' || videoContainer1.style.display === '') {
            videoContainer1.style.display = 'block';

            // 绘制矩形框效果
            const frame = document.getElementById('video-frame');
            frame.style.border = '3px solid #333';
            frame.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

            // 播放视频
            videoPlayer1.play();
        } else {
            videoContainer1.style.display = 'none';
            videoPlayer1.pause();
        }
    });
});
document.addEventListener('DOMContentLoaded', function () {
    const clickElement = document.querySelector('.l03');
    const videoContainer2 = document.getElementById('video-container2');
    const videoPlayer2 = document.getElementById('video-player2');

    clickElement.addEventListener('click', function () {
        // 切换视频容器的显示状态
        if (videoContainer2.style.display === 'none' || videoContainer2.style.display === '') {
            videoContainer2.style.display = 'block';

            // 绘制矩形框效果
            const frame = document.getElementById('video-frame');
            frame.style.border = '3px solid #333';
            frame.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)';

            // 播放视频
            videoPlayer2.play();
        } else {
            videoContainer2.style.display = 'none';
            videoPlayer2.pause();
        }
    });
});

