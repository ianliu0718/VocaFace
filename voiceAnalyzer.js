// Voice Analyzer - Handles audio recording and feature extraction
class VoiceAnalyzer {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.analyzer = null;
        this.dataArray = null;
        this.isRecording = false;
        this.audioChunks = [];
        this.voiceFeatures = {
            pitch: 0,
            volume: 0,
            toneVariation: 0
        };
        this.pitchHistory = [];
        this.volumeHistory = [];
    }

    async initialize() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: false
                } 
            });
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            
            this.analyzer = this.audioContext.createAnalyser();
            this.analyzer.fftSize = 2048;
            this.analyzer.smoothingTimeConstant = 0.8;
            
            source.connect(this.analyzer);
            
            const bufferLength = this.analyzer.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            this.frequencyArray = new Uint8Array(bufferLength);
            
            this.mediaRecorder = new MediaRecorder(this.mediaStream);
            this.audioChunks = [];
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            return true;
        } catch (error) {
            console.error('Error initializing audio:', error);
            // Error will be handled by the calling function
            throw new Error('無法訪問麥克風。請確認已授權麥克風權限。');
        }
    }

    startRecording() {
        this.audioChunks = [];
        this.pitchHistory = [];
        this.volumeHistory = [];
        this.isRecording = true;
        this.mediaRecorder.start();
    }

    stopRecording() {
        return new Promise((resolve) => {
            this.isRecording = false;
            this.mediaRecorder.stop();
            
            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
                resolve(audioBlob);
            };
        });
    }

    getVisualizationData() {
        if (!this.analyzer) return null;
        this.analyzer.getByteTimeDomainData(this.dataArray);
        return this.dataArray;
    }

    analyzeVoice() {
        if (!this.analyzer) return null;

        // Get frequency data
        this.analyzer.getByteFrequencyData(this.frequencyArray);
        
        // Calculate volume (average amplitude)
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            const normalized = (this.dataArray[i] - 128) / 128;
            sum += Math.abs(normalized);
        }
        const volume = sum / this.dataArray.length;
        this.volumeHistory.push(volume);

        // Calculate dominant frequency (pitch approximation)
        let maxValue = 0;
        let maxIndex = 0;
        const minFreq = 50; // Ignore very low frequencies (noise)
        const maxFreq = 400; // Focus on human voice range
        
        const nyquist = this.audioContext.sampleRate / 2;
        const minIndex = Math.floor(minFreq * this.frequencyArray.length / nyquist);
        const maxIndex_limit = Math.floor(maxFreq * this.frequencyArray.length / nyquist);
        
        for (let i = minIndex; i < maxIndex_limit && i < this.frequencyArray.length; i++) {
            if (this.frequencyArray[i] > maxValue) {
                maxValue = this.frequencyArray[i];
                maxIndex = i;
            }
        }
        
        const pitch = maxIndex * nyquist / this.frequencyArray.length;
        if (maxValue > 20) { // Only record significant pitches
            this.pitchHistory.push(pitch);
        }

        return {
            volume: volume,
            pitch: pitch,
            frequency: this.frequencyArray
        };
    }

    calculateFeatures() {
        // Calculate average pitch
        const avgPitch = this.pitchHistory.length > 0 
            ? this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length 
            : 150;
        
        // Calculate average volume
        const avgVolume = this.volumeHistory.length > 0
            ? this.volumeHistory.reduce((a, b) => a + b, 0) / this.volumeHistory.length
            : 0.5;

        // Calculate tone variation (standard deviation of pitch)
        let toneVariation = 0;
        if (this.pitchHistory.length > 1) {
            const variance = this.pitchHistory.reduce((sum, pitch) => {
                return sum + Math.pow(pitch - avgPitch, 2);
            }, 0) / this.pitchHistory.length;
            toneVariation = Math.sqrt(variance);
        }

        // Normalize values to 0-100 range
        this.voiceFeatures = {
            pitch: Math.min(100, Math.max(0, ((avgPitch - 80) / 200) * 100)),
            volume: Math.min(100, avgVolume * 200),
            toneVariation: Math.min(100, (toneVariation / 50) * 100)
        };

        return this.voiceFeatures;
    }

    getFeatures() {
        return this.voiceFeatures;
    }

    cleanup() {
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoiceAnalyzer;
}
