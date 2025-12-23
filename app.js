// Main Application - Coordinates voice analysis and avatar generation
class VocaFaceApp {
    constructor() {
        this.GENERATION_DELAY_MS = 500; // Delay for avatar generation effect
        this.voiceAnalyzer = new VoiceAnalyzer();
        this.avatarGenerator = null;
        this.visualizerCanvas = document.getElementById('visualizer');
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
        this.animationId = null;
        this.isAnalyzing = false;
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.generateBtn = document.getElementById('generateBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.recordingStatus = document.getElementById('recordingStatus');
        
        this.pitchValue = document.getElementById('pitchValue');
        this.volumeValue = document.getElementById('volumeValue');
        this.toneValue = document.getElementById('toneValue');
        
        this.pitchBar = document.getElementById('pitchBar');
        this.volumeBar = document.getElementById('volumeBar');
        this.toneBar = document.getElementById('toneBar');
        
        this.avatarCanvas = document.getElementById('avatarCanvas');
        this.avatarGenerator = new AvatarGenerator(this.avatarCanvas);
    }

    setupEventListeners() {
        this.recordBtn.addEventListener('click', () => this.startRecording());
        this.stopBtn.addEventListener('click', () => this.stopRecording());
        this.generateBtn.addEventListener('click', () => this.generateAvatar());
        this.downloadBtn.addEventListener('click', () => this.downloadAvatar());
    }

    async startRecording() {
        // Initialize audio on first use
        if (!this.voiceAnalyzer.audioContext) {
            try {
                const initialized = await this.voiceAnalyzer.initialize();
                if (!initialized) return;
            } catch (error) {
                this.updateStatus('錯誤：' + error.message, 'recording');
                return;
            }
        }

        this.recordBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.generateBtn.disabled = true;
        this.recordBtn.classList.add('recording');
        
        this.voiceAnalyzer.startRecording();
        this.isAnalyzing = true;
        
        this.updateStatus('錄音中...請開始說話', 'recording');
        this.startVisualization();
        
        // Auto-analyze voice continuously during recording
        this.analyzeInterval = setInterval(() => {
            this.voiceAnalyzer.analyzeVoice();
        }, 100);
    }

    async stopRecording() {
        this.recordBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.recordBtn.classList.remove('recording');
        this.isAnalyzing = false;
        
        clearInterval(this.analyzeInterval);
        cancelAnimationFrame(this.animationId);
        
        this.updateStatus('正在分析聲音特徵...', 'analyzing');
        
        await this.voiceAnalyzer.stopRecording();
        
        // Calculate final features
        const features = this.voiceAnalyzer.calculateFeatures();
        this.displayFeatures(features);
        
        this.updateStatus('分析完成！可以生成人像了', 'ready');
        this.generateBtn.disabled = false;
    }

    startVisualization() {
        const draw = () => {
            if (!this.isAnalyzing) return;
            
            const data = this.voiceAnalyzer.getVisualizationData();
            if (!data) return;
            
            const width = this.visualizerCanvas.width;
            const height = this.visualizerCanvas.height;
            
            this.visualizerCtx.fillStyle = '#f5f5f5';
            this.visualizerCtx.fillRect(0, 0, width, height);
            
            this.visualizerCtx.lineWidth = 2;
            this.visualizerCtx.strokeStyle = '#667eea';
            this.visualizerCtx.beginPath();
            
            const sliceWidth = width / data.length;
            let x = 0;
            
            for (let i = 0; i < data.length; i++) {
                const v = data[i] / 128.0;
                const y = v * height / 2;
                
                if (i === 0) {
                    this.visualizerCtx.moveTo(x, y);
                } else {
                    this.visualizerCtx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            this.visualizerCtx.lineTo(width, height / 2);
            this.visualizerCtx.stroke();
            
            this.animationId = requestAnimationFrame(draw);
        };
        
        draw();
    }

    displayFeatures(features) {
        // Update text values
        this.pitchValue.textContent = Math.round(features.pitch);
        this.volumeValue.textContent = Math.round(features.volume);
        this.toneValue.textContent = Math.round(features.toneVariation);
        
        // Update progress bars
        this.pitchBar.style.width = features.pitch + '%';
        this.volumeBar.style.width = features.volume + '%';
        this.toneBar.style.width = features.toneVariation + '%';
        
        // Add descriptive labels
        const pitchLabel = features.pitch < 40 ? '低沉' : features.pitch < 60 ? '中等' : '明亮';
        const volumeLabel = features.volume < 40 ? '輕柔' : features.volume < 60 ? '適中' : '響亮';
        const toneLabel = features.toneVariation < 40 ? '平穩' : features.toneVariation < 60 ? '變化適中' : '富變化';
        
        this.pitchValue.textContent = `${Math.round(features.pitch)} (${pitchLabel})`;
        this.volumeValue.textContent = `${Math.round(features.volume)} (${volumeLabel})`;
        this.toneValue.textContent = `${Math.round(features.toneVariation)} (${toneLabel})`;
    }

    generateAvatar() {
        this.generateBtn.disabled = true;
        this.updateStatus('正在生成你的專屬人像...', 'analyzing');
        
        // Add a small delay for effect
        setTimeout(() => {
            const features = this.voiceAnalyzer.getFeatures();
            this.avatarGenerator.generate(features);
            
            this.updateStatus('人像生成完成！', 'ready');
            this.downloadBtn.style.display = 'inline-flex';
            this.generateBtn.disabled = false;
            this.generateBtn.querySelector('.text').textContent = '重新生成';
        }, this.GENERATION_DELAY_MS);
    }

    downloadAvatar() {
        this.avatarGenerator.downloadImage();
    }

    updateStatus(message, type) {
        this.recordingStatus.textContent = message;
        this.recordingStatus.className = 'status ' + type;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new VocaFaceApp();
    
    // Add welcome message
    console.log('%c🎤 VocaFace - 語音捏臉小遊戲', 'font-size: 20px; font-weight: bold; color: #667eea;');
    console.log('用你的聲音創造獨特的 3D 人像！');
});
