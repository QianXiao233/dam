document.getElementById('camera-grid').innerHTML = `
                    <div class="camera-item" style="cursor:pointer">
                        <img src="/images/bg-landscape.jpg" alt="监控画面" id="camera-item-01" style="cursor:pointer">
                        <div class="camera-label" id="camera-label-01" style="cursor:pointer">监控画面</div>
                    </div>
                    <div class="camera-item">
                        <img src="/images/bg-landscape.jpg" alt="监控画面" style="cursor:pointer">
                        <div class="camera-label">监控画面</div>
                    </div>
                    <div class="camera-item">
                        <img src="/images/bg-landscape.jpg" alt="监控画面" style="cursor:pointer">
                        <div class="camera-label">监控画面</div>
                    </div>
                    <div class="camera-item">
                        <img src="/images/bg-landscape.jpg" alt="监控画面" style="cursor:pointer">
                        <div class="camera-label">监控画面</div>
                    </div>
`;

document.addEventListener('DOMContentLoaded', function () {
    const clickElement = document.querySelector('.camera-item');
    const videoContainer = document.getElementById('video-container');
    const videoElement = document.createElement('video_feed');
    videoElement.crossOrigin = "anonymous";
    videoElement.src = window.apiUrls.VEDIO_URL;
    videoContainer.style.display = 'none';
    clickElement.addEventListener('click', function () {
        if(videoContainer.style.display === 'none'){
            videoContainer.style.display = 'block';
        }else{
            videoContainer.style.display = 'none';
        }
        
    });
});