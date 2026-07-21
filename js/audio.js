// Web Audio API Synthesizer for Mecha Chameleon
import bgmUrl from '../bgm.wav';

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = null;
        this.ambientOsc = null;
        this.ambientFilter = null;
        this.isMuted = false;
        this.initialized = false;
        
        // Background Music Audio Element (compiled via Vite)
        this.bgm = new Audio(bgmUrl);
        this.bgm.loop = true;
        this.bgm.volume = 0.55; // increased default volume for clear audibility
    }

    // Initialize Audio Context on user interaction
    init() {
        if (this.initialized) return;
        
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
            
            // Setup master volume
            this.masterVolume = this.ctx.createGain();
            this.masterVolume.gain.setValueAtTime(0.3, this.ctx.currentTime); // Master gain set to 30%
            this.masterVolume.connect(this.ctx.destination);
            
            this.initialized = true;
            console.log("Audio Context initialized successfully.");
            
            // Start ambient loop
            this.startAmbientHum();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser", e);
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Dynamic Sound Synthesis Routines

    // 1. Footstep Thuds (Mechanical robotic stomp)
    playFootstep() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        
        // Pitch sweep oscillator
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);

        // Low pass filter to make it deep
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, now);

        // Volume envelope
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        // Connect
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + 0.16);

        // Synthesize a tiny bit of high-frequency friction/noise
        const bufferSize = this.ctx.sampleRate * 0.05; // 50ms of noise
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.Q.setValueAtTime(3, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.08, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterVolume);

        noise.start(now);
        noise.stop(now + 0.06);
    }

    // 2. Scan / Click (Raycasting attempt, mechanical click)
    playScanClick() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // 3. Target Found Chime (Ascending robotic sci-fi sweep)
    playTargetFound() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [261.63, 329.63, 392.00, 523.25, 783.99]; // C4, E4, G4, C5, G5
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.06;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.5, time + 0.15);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, time);
            filter.frequency.exponentialRampToValueAtTime(600, time + 0.15);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.18, time + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.start(time);
            osc.stop(time + 0.3);
        });
    }

    // 4. Bonus Sage Found (Triumphant mathematical chime - high pitch sine arpeggio)
    playSageFound() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6 (magical arpeggio)
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.04;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            
            osc.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.start(time);
            osc.stop(time + 0.45);
        });
    }

    // 5. Error Buzz (Wrong click penalty)
    playErrorBuzz() {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        
        // Detuned dual square waves
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(98, now); // G2
        
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(101.5, now); // Detuned G2
        
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, now);
        
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterVolume);
        
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);
    }

    // 6. Countdown Warning Tick
    playTick(isDanger = false) {
        if (!this.initialized || this.isMuted) return;
        this.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Danger ticks are higher pitch
        osc.frequency.setValueAtTime(isDanger ? 1600 : 1000, now);

        gain.gain.setValueAtTime(isDanger ? 0.25 : 0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.masterVolume);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // 6.5. HTML5 Background Music Player (plays imported bgm.mp3 asset)
    startBGM() {
        if (!this.initialized) return;
        this.resume();
        
        if (this.bgm) {
            this.bgm.muted = this.isMuted;
            this.bgm.currentTime = 0;
            this.bgm.play().catch(err => {
                console.warn("BGM autoplay was blocked by browser. It will resume on next user input:", err);
            });
        }
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    }

    // 7. Ambient Drone Loop (Generates background hum)
    startAmbientHum() {
        if (!this.initialized || this.isMuted || this.ambientOsc) return;

        const now = this.ctx.currentTime;
        this.ambientOsc = this.ctx.createOscillator();
        this.ambientFilter = this.ctx.createBiquadFilter();
        const ambientGain = this.ctx.createGain();

        this.ambientOsc.type = 'sawtooth';
        this.ambientOsc.frequency.setValueAtTime(55, now); // A1 note

        this.ambientFilter.type = 'lowpass';
        this.ambientFilter.frequency.setValueAtTime(100, now);
        this.ambientFilter.Q.setValueAtTime(5, now);

        // Low frequency LFO to modulate filter cutoff (makes it breathe)
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(0.15, now); // 0.15 Hz
        lfoGain.gain.setValueAtTime(25, now); // range of +/- 25Hz

        lfo.connect(lfoGain);
        lfoGain.connect(this.ambientFilter.frequency);

        ambientGain.gain.setValueAtTime(0.18, now); // Keep background hum soft

        this.ambientOsc.connect(this.ambientFilter);
        this.ambientFilter.connect(ambientGain);
        ambientGain.connect(this.masterVolume);

        lfo.start(now);
        this.ambientOsc.start(now);
    }

    stopAmbientHum() {
        if (this.ambientOsc) {
            try {
                this.ambientOsc.stop();
            } catch (e) {}
            this.ambientOsc = null;
            this.ambientFilter = null;
        }
    }

    // 8. Game Over Defeat Music (Descending minor structure)
    playDefeatMusic() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        this.stopAmbientHum();

        const now = this.ctx.currentTime;
        const notes = [196.00, 164.81, 130.81, 98.00]; // G3, E3b, C3, G2
        
        notes.forEach((freq, idx) => {
            const time = now + idx * 0.25;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);
            
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(300, time);
            
            gain.gain.setValueAtTime(0, time);
            gain.gain.linearRampToValueAtTime(0.15, time + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.7);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterVolume);
            
            osc.start(time);
            osc.stop(time + 0.85);
        });
    }

    // 9. Victory Fanfare (Triumphant major arpeggio / chords)
    playVictoryMusic() {
        if (!this.initialized || this.isMuted) return;
        this.resume();
        this.stopAmbientHum();

        const now = this.ctx.currentTime;
        const chords = [
            [261.63, 329.63, 392.00], // C4 major
            [349.23, 440.00, 523.25], // F4 major
            [392.00, 493.88, 587.33], // G4 major
            [523.25, 659.25, 783.99, 1046.50] // C5 major triumphant
        ];

        chords.forEach((chord, chordIdx) => {
            const time = now + chordIdx * 0.35;
            
            chord.forEach((freq) => {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                const filter = this.ctx.createBiquadFilter();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, time);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1200, time);
                filter.Q.setValueAtTime(1, time);
                
                const duration = chordIdx === 3 ? 1.2 : 0.3;
                
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(0.08, time + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterVolume);
                
                osc.start(time);
                osc.stop(time + duration + 0.1);
            });
        });
    }
}

// Export singleton
export const audioManager = new AudioManager();
export default audioManager;
