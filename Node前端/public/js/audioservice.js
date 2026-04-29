/**
 * 音频播放器类 - 支持播放、暂停、停止、音量控制、进度控制
 */
class AudioPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.currentSrc = null;
        this.volume = 0.8;
        this.playbackRate = 1.0;
        this.loop = false;
        
        // 事件回调
        this.onTimeUpdate = null;
        this.onLoad = null;
        this.onEnd = null;
        this.onError = null;
        this.onPlay = null;
        this.onPause = null;
    }

    /**
     * 加载音频文件
     * @param {string|Blob|File} source - 音频URL、文件对象或Blob
     */
    load(source) {
        // 清理旧音频
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        this.audio = new Audio();
        
        // 绑定事件
        this.audio.addEventListener('timeupdate', () => {
            if (this.onTimeUpdate) this.onTimeUpdate(this.getCurrentTime(), this.getDuration());
        });
        
        this.audio.addEventListener('loadedmetadata', () => {
            if (this.onLoad) this.onLoad(this.getDuration());
        });
        
        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            if (this.onEnd) this.onEnd();
        });
        
        this.audio.addEventListener('error', (e) => {
            if (this.onError) this.onError(e);
        });
        
        this.audio.addEventListener('play', () => {
            this.isPlaying = true;
            if (this.onPlay) this.onPlay();
        });
        
        this.audio.addEventListener('pause', () => {
            this.isPlaying = false;
            if (this.onPause) this.onPause();
        });

        // 设置属性
        this.audio.volume = this.volume;
        this.audio.playbackRate = this.playbackRate;
        this.audio.loop = this.loop;
        
        // 设置源
        if (typeof source === 'string') {
            this.audio.src = source;
            this.currentSrc = source;
        } else if (source instanceof Blob || source instanceof File) {
            const url = URL.createObjectURL(source);
            this.audio.src = url;
            this.currentSrc = url;
            // 注意：需要手动 revokeObjectURL，在销毁时处理
        }
        
        this.audio.load();
    }

    /**
     * 播放音频
     */
    play() {
        if (this.audio) {
            return this.audio.play().catch(err => {
                console.error('播放失败:', err);
                throw err;
            });
        }
        return Promise.reject(new Error('未加载音频'));
    }

    /**
     * 暂停播放
     */
    pause() {
        if (this.audio && this.isPlaying) {
            this.audio.pause();
        }
    }

    /**
     * 停止播放（重置到开始）
     */
    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.isPlaying = false;
        }
    }

    /**
     * 跳转到指定时间（秒）
     * @param {number} seconds 
     */
    seek(seconds) {
        if (this.audio && !isNaN(seconds)) {
            this.audio.currentTime = Math.max(0, Math.min(seconds, this.getDuration()));
        }
    }

    /**
     * 设置音量
     * @param {number} vol - 0-1之间
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    }

    /**
     * 获取当前音量
     */
    getVolume() {
        return this.volume;
    }

    /**
     * 设置播放速度
     * @param {number} rate - 0.5-4.0之间
     */
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.5, Math.min(4, rate));
        if (this.audio) {
            this.audio.playbackRate = this.playbackRate;
        }
    }

    /**
     * 设置循环播放
     * @param {boolean} loop 
     */
    setLoop(loop) {
        this.loop = loop;
        if (this.audio) {
            this.audio.loop = loop;
        }
    }

    /**
     * 获取当前播放时间（秒）
     */
    getCurrentTime() {
        return this.audio ? this.audio.currentTime : 0;
    }

    /**
     * 获取音频总时长（秒）
     */
    getDuration() {
        return this.audio && !isNaN(this.audio.duration) ? this.audio.duration : 0;
    }

    /**
     * 获取播放状态
     */
    getIsPlaying() {
        return this.isPlaying;
    }

    /**
     * 静音切换
     */
    toggleMute() {
        if (this.audio) {
            this.audio.muted = !this.audio.muted;
            return this.audio.muted;
        }
        return false;
    }

    /**
     * 销毁播放器，释放资源
     */
    destroy() {
        if (this.audio) {
            this.audio.pause();
            if (this.currentSrc && this.currentSrc.startsWith('blob:')) {
                URL.revokeObjectURL(this.currentSrc);
            }
            this.audio.src = '';
            this.audio = null;
        }
        this.isPlaying = false;
    }
}