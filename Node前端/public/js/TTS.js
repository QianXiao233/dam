class CrossPlatformTTS {
    static VOICE_MAP = {
        'zh-CN': [
            'Microsoft Yaoyao',
            'Tingting',
            'Google 普通话（中国大陆）',
            'zh-CN-Wavenet-C'
        ]
    };
    
    constructor() {
        this.isPlaying = false;
        this.currentUtterance = null;
        this.defaultRate = 1;  // 默认语速
    }
    
    async speak(text, targetLang = 'zh-CN', rate = null) {
        // 使用传入的语速，否则用默认值
        const speechRate = rate !== null ? rate : this.defaultRate;
        
        this.forceStop();
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
        utterance.rate = speechRate;  // 设置语速
        utterance.pitch = 1;          // 音调（可选）
        utterance.volume = 1;         // 音量（可选）
        
        this.currentUtterance = utterance;
        
        utterance.onstart = () => { this.isPlaying = true; };
        utterance.onend = () => { this.isPlaying = false; this.currentUtterance = null; };
        utterance.onerror = () => { this.isPlaying = false; this.currentUtterance = null; };
        
        speechSynthesis.speak(utterance);
    }
    
    // 设置默认语速
    setDefaultRate(rate) {
        // 语速范围：0.1 - 10，推荐 0.5 - 2
        this.defaultRate = Math.max(0.1, Math.min(10, rate));
    }
    
    forceStop() {
        speechSynthesis.cancel();
        if (this.currentUtterance) {
            try {
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