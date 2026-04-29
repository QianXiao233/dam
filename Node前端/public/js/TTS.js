class CrossPlatformTTS {
    static VOICE_MAP = {
        'zh-CN': [
            'Microsoft Xiaoxiao',
            'Tingting',
            'Google 普通话（中国大陆）',
            'zh-CN-Wavenet-C'
        ]
    };
    
    constructor() {
        this.isPlaying = false;
        this.currentUtterance = null;
    }
    
    async speak(text, targetLang = 'zh-CN') {
        // 先彻底停止并清空队列
        this.forceStop();
        
        // 等待一小段时间确保 cancel 生效
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const voices = await this.getVoices();
        
        let selectedVoice = null;
        const preferredNames = CrossPlatformTTS.VOICE_MAP[targetLang] || [];
        
        for (const preferred of preferredNames) {
            selectedVoice = voices.find(voice => 
                voice.name.includes(preferred) || 
                voice.name === preferred ||
                (voice.lang === targetLang && voice.name.toLowerCase().includes(preferred.toLowerCase()))
            );
            if (selectedVoice) break;
        }
        
        if (!selectedVoice) {
            selectedVoice = voices.find(voice => voice.lang === targetLang);
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.lang = targetLang;
        
        this.currentUtterance = utterance;
        
        utterance.onstart = () => { this.isPlaying = true; };
        utterance.onend = () => { this.isPlaying = false; this.currentUtterance = null; };
        utterance.onerror = () => { this.isPlaying = false; this.currentUtterance = null; };
        
        speechSynthesis.speak(utterance);
    }
    
    // 强制停止（有效版本）
    forceStop() {
        // 方法1：cancel 停止当前
        speechSynthesis.cancel();
        
        // 方法2：某些浏览器需要重新实例化才能彻底清空
        if (this.currentUtterance) {
            try {
                // 强制结束当前 utterance
                this.currentUtterance.onend = null;
                this.currentUtterance.onerror = null;
            } catch(e) {}
            this.currentUtterance = null;
        }
        
        this.isPlaying = false;
    }
    
    pause() {
        if (this.isPlaying) {
            speechSynthesis.pause();
        }
    }
    
    resume() {
        speechSynthesis.resume();
    }
    
    stop() {
        this.forceStop();
    }
    
    getVoices() {
        return new Promise((resolve) => {
            const voices = speechSynthesis.getVoices();
            if (voices.length) {
                resolve(voices);
            } else {
                speechSynthesis.onvoiceschanged = () => {
                    resolve(speechSynthesis.getVoices());
                };
            }
        });
    }
}