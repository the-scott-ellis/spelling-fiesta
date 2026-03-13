// Sound effects using Web Audio API - no audio files needed

const SoundManager = {
    ctx: null,

    init() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },

    // Ensure audio context is resumed (required after user interaction)
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    // Play a tone at a given frequency for a duration
    _playTone(freq, duration, type = 'square', volume = 0.15, startTime = 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + startTime);
        osc.stop(this.ctx.currentTime + startTime + duration);
    },

    // White noise burst for applause texture
    _playNoise(duration, volume = 0.08, startTime = 0) {
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime + startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(this.ctx.currentTime + startTime);
    },

    // Correct answer - happy ascending chime + noise applause
    playCorrect() {
        this.resume();
        // C-E-G arpeggio (happy sound)
        this._playTone(523, 0.2, 'square', 0.12, 0);      // C5
        this._playTone(659, 0.2, 'square', 0.12, 0.1);     // E5
        this._playTone(784, 0.3, 'square', 0.12, 0.2);     // G5
        this._playTone(1047, 0.4, 'square', 0.10, 0.3);    // C6
        // Applause noise
        this._playNoise(0.8, 0.06, 0.1);
    },

    // Wrong answer - gentle low buzz
    playWrong() {
        this.resume();
        this._playTone(150, 0.4, 'sawtooth', 0.08, 0);
        this._playTone(130, 0.3, 'sawtooth', 0.06, 0.15);
    },

    // Winner fanfare
    playFanfare() {
        this.resume();
        // Ascending scale
        const notes = [523, 587, 659, 698, 784, 880, 988, 1047];
        notes.forEach((freq, i) => {
            this._playTone(freq, 0.25, 'square', 0.10, i * 0.12);
        });
        // Final chord
        this._playTone(523, 0.8, 'square', 0.08, 1.0);
        this._playTone(659, 0.8, 'square', 0.08, 1.0);
        this._playTone(784, 0.8, 'square', 0.08, 1.0);
        this._playNoise(1.0, 0.05, 1.0);
    },

    // UI blip
    playClick() {
        this.resume();
        this._playTone(880, 0.08, 'square', 0.06);
    },

    // Word announced sound (ding)
    playAnnounce() {
        this.resume();
        this._playTone(659, 0.15, 'sine', 0.10);
        this._playTone(880, 0.2, 'sine', 0.08, 0.1);
    },

    // Mic active indicator beep
    playMicOn() {
        this.resume();
        this._playTone(440, 0.1, 'sine', 0.06);
    }
};
