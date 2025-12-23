class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.dataArray = null;
        this.isInitialized = false;
        
        // Analysis Data
        this.currentPitch = 0;
        this.currentVolume = 0;
        this.pitchHistory = [];
        this.volumeHistory = [];
    }

    async init() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 2048;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            
            this.microphone.connect(this.analyser);
            this.isInitialized = true;
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            console.log("Audio Engine Initialized");
        } catch (err) {
            console.error("Audio Init Failed:", err);
            alert("Microphone access denied or error occurred.");
        }
    }

    getAudioData() {
        if (!this.isInitialized) return null;
        
        this.analyser.getByteTimeDomainData(this.dataArray); // Waveform data
        
        // Calculate Volume (RMS)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const x = (this.dataArray[i] - 128) / 128.0;
            sum += x * x;
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        this.currentVolume = Math.round(rms * 100); // 0-100 scale rough approx

        // Calculate Pitch (Simple Zero Crossing)
        // Note: Zero crossing is basic but enough for "High vs Low" voice distinction
        let zeroCrossings = 0;
        for (let i = 1; i < this.dataArray.length; i++) {
             if ((this.dataArray[i-1] - 128) < 0 && (this.dataArray[i] - 128) >= 0) {
                 zeroCrossings++;
             }
        }
        // Approximate Hz = zeroCrossings * (sampleRate / fftSize) ... roughly
        // Better: Hz = zeroCrossings / (time duration of buffer)
        // Buffer duration = fftSize / sampleRate
        // So Hz = zeroCrossings / (fftSize / sampleRate) = zeroCrossings * sampleRate / fftSize
        const nyquist = this.audioContext.sampleRate / 2;
        // This is a very rough estimator but works for relative pitch difference
        this.currentPitch = Math.round(zeroCrossings * (this.audioContext.sampleRate / this.analyser.fftSize));

        // Store history for average calculation
        if (this.currentVolume > 5) { // Only record if there is sound
            this.pitchHistory.push(this.currentPitch);
            this.volumeHistory.push(this.currentVolume);
        }

        return {
            waveform: this.dataArray,
            volume: this.currentVolume,
            pitch: this.currentPitch
        };
    }

    resetAnalysis() {
        this.pitchHistory = [];
        this.volumeHistory = [];
    }

    getAverageStats() {
        if (this.pitchHistory.length === 0) return { pitch: 0, volume: 0 };
        
        const avgPitch = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
        const avgVol = this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length;
        
        return {
            pitch: Math.round(avgPitch),
            volume: Math.round(avgVol)
        };
    }
}
