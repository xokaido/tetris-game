// Audio Manager for Tetris game

class AudioManager {
    private audioContext: AudioContext | null = null;
    private sounds: Map<string, AudioBuffer> = new Map();
    private musicSource: AudioBufferSourceNode | null = null;
    private musicGainNode: GainNode | null = null;
    private effectsGainNode: GainNode | null = null;
    private isMusicPlaying = false;

    public soundEnabled = true;
    public musicEnabled = true;

    constructor() {
        // Defer AudioContext creation until user interaction
    }

    private ensureContext(): AudioContext {
        if (!this.audioContext) {
            this.audioContext = new AudioContext();
            this.musicGainNode = this.audioContext.createGain();
            this.effectsGainNode = this.audioContext.createGain();
            this.musicGainNode.connect(this.audioContext.destination);
            this.effectsGainNode.connect(this.audioContext.destination);
            this.musicGainNode.gain.value = 0.3;
            this.effectsGainNode.gain.value = 0.5;
        }
        return this.audioContext;
    }

    async init(): Promise<void> {
        const ctx = this.ensureContext();

        // Generate synthesized sounds
        this.sounds.set('rotate', await this.createRotateSound(ctx));
        this.sounds.set('drop', await this.createDropSound(ctx));
        this.sounds.set('clear', await this.createClearSound(ctx));
        this.sounds.set('tetris', await this.createTetrisSound(ctx));
        this.sounds.set('levelup', await this.createLevelUpSound(ctx));
        this.sounds.set('gameover', await this.createGameOverSound(ctx));
        this.sounds.set('move', await this.createMoveSound(ctx));
        this.sounds.set('music', await this.createTetrisMusic(ctx));
    }

    private async createTone(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = 'square'): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            let sample = 0;

            switch (type) {
                case 'sine':
                    sample = Math.sin(2 * Math.PI * frequency * t);
                    break;
                case 'square':
                    sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 0.5 : -0.5;
                    break;
                case 'triangle':
                    sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
                    break;
                case 'sawtooth':
                    sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
                    break;
            }

            // Apply envelope
            const envelope = 1 - (i / length);
            data[i] = sample * envelope * 0.3;
        }

        return buffer;
    }

    private async createRotateSound(ctx: AudioContext): Promise<AudioBuffer> {
        return this.createTone(ctx, 600, 0.05, 'square');
    }

    private async createMoveSound(ctx: AudioContext): Promise<AudioBuffer> {
        return this.createTone(ctx, 200, 0.03, 'square');
    }

    private async createDropSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const duration = 0.15;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = 300 - (t * 1500);
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = 1 - (i / length);
            data[i] = sample * envelope * 0.4;
        }

        return buffer;
    }

    private async createClearSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const duration = 0.3;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = 400 + (t * 600);
            const sample = Math.sin(2 * Math.PI * frequency * t) * 0.5 +
                Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.3;
            const envelope = 1 - (i / length);
            data[i] = sample * envelope * 0.4;
        }

        return buffer;
    }

    private async createTetrisSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const duration = 0.6;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Fanfare-like sound for Tetris
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.min(Math.floor(t / 0.15), notes.length - 1);
            const frequency = notes[noteIndex];

            let sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 +
                Math.sin(2 * Math.PI * frequency * 2 * t) * 0.2;

            const noteProgress = (t % 0.15) / 0.15;
            const envelope = (1 - noteProgress) * (1 - (i / length) * 0.5);
            data[i] = sample * envelope * 0.5;
        }

        return buffer;
    }

    private async createLevelUpSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const duration = 0.4;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = 400 + (t * 800);
            const sample = Math.sin(2 * Math.PI * frequency * t) * 0.4 +
                Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.2;
            const envelope = Math.sin((t / duration) * Math.PI);
            data[i] = sample * envelope * 0.4;
        }

        return buffer;
    }

    private async createGameOverSound(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const duration = 1.0;
        const length = sampleRate * duration;
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const frequency = 400 - (t * 300);
            const sample = Math.sin(2 * Math.PI * frequency * t);
            const envelope = 1 - (i / length);
            data[i] = sample * envelope * 0.3;
        }

        return buffer;
    }

    private async createTetrisMusic(ctx: AudioContext): Promise<AudioBuffer> {
        const sampleRate = ctx.sampleRate;
        const bpm = 140;
        const beatDuration = 60 / bpm;
        const measures = 8;
        const duration = measures * 4 * beatDuration;
        const length = Math.floor(sampleRate * duration);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        // Classic Tetris theme (Korobeiniki) - simplified melody
        const melody = [
            // Measure 1
            { note: 659.25, duration: 1 }, // E5
            { note: 493.88, duration: 0.5 }, // B4
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 1 }, // D5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 493.88, duration: 0.5 }, // B4
            // Measure 2
            { note: 440, duration: 1 }, // A4
            { note: 440, duration: 0.5 }, // A4
            { note: 523.25, duration: 0.5 }, // C5
            { note: 659.25, duration: 1 }, // E5
            { note: 587.33, duration: 0.5 }, // D5
            { note: 523.25, duration: 0.5 }, // C5
            // Measure 3
            { note: 493.88, duration: 1.5 }, // B4
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 1 }, // D5
            { note: 659.25, duration: 1 }, // E5
            // Measure 4
            { note: 523.25, duration: 1 }, // C5
            { note: 440, duration: 1 }, // A4
            { note: 440, duration: 2 }, // A4
            // Measures 5-8 repeat with variation
            { note: 587.33, duration: 1.5 }, // D5
            { note: 698.46, duration: 0.5 }, // F5
            { note: 880, duration: 1 }, // A5
            { note: 783.99, duration: 0.5 }, // G5
            { note: 698.46, duration: 0.5 }, // F5
            { note: 659.25, duration: 1.5 }, // E5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 659.25, duration: 1 }, // E5
            { note: 587.33, duration: 0.5 }, // D5
            { note: 523.25, duration: 0.5 }, // C5
            { note: 493.88, duration: 1 }, // B4
            { note: 493.88, duration: 0.5 }, // B4
            { note: 523.25, duration: 0.5 }, // C5
            { note: 587.33, duration: 1 }, // D5
            { note: 659.25, duration: 1 }, // E5
            { note: 523.25, duration: 1 }, // C5
            { note: 440, duration: 1 }, // A4
            { note: 440, duration: 1 }, // A4
        ];

        let currentTime = 0;

        for (const { note, duration: noteDuration } of melody) {
            const noteStart = Math.floor(currentTime * sampleRate);
            const noteEnd = Math.floor((currentTime + noteDuration * beatDuration) * sampleRate);

            for (let i = noteStart; i < noteEnd && i < length; i++) {
                const t = (i - noteStart) / sampleRate;
                const noteLengthSeconds = noteDuration * beatDuration;

                // Main tone with harmonics
                let sample = Math.sin(2 * Math.PI * note * t) * 0.5 +
                    Math.sin(2 * Math.PI * note * 2 * t) * 0.15 +
                    Math.sin(2 * Math.PI * note * 0.5 * t) * 0.1;

                // ADSR envelope
                const attackTime = 0.01;
                const decayTime = 0.05;
                const sustainLevel = 0.7;
                const releaseTime = 0.1;
                const releaseStart = noteLengthSeconds - releaseTime;

                let envelope = 1;
                if (t < attackTime) {
                    envelope = t / attackTime;
                } else if (t < attackTime + decayTime) {
                    envelope = 1 - ((t - attackTime) / decayTime) * (1 - sustainLevel);
                } else if (t < releaseStart) {
                    envelope = sustainLevel;
                } else {
                    envelope = sustainLevel * (1 - (t - releaseStart) / releaseTime);
                }

                data[i] += sample * Math.max(0, envelope) * 0.25;
            }

            currentTime += noteDuration * beatDuration;
        }

        return buffer;
    }

    play(soundName: string): void {
        if (!this.soundEnabled || !this.audioContext) return;

        const buffer = this.sounds.get(soundName);
        if (!buffer || !this.effectsGainNode) return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.effectsGainNode);
        source.start();
    }

    startMusic(): void {
        if (!this.musicEnabled || this.isMusicPlaying) return;

        const ctx = this.ensureContext();
        const buffer = this.sounds.get('music');
        if (!buffer || !this.musicGainNode) return;

        if (ctx.state === 'suspended') {
            ctx.resume();
        }

        this.stopMusic();

        this.musicSource = ctx.createBufferSource();
        this.musicSource.buffer = buffer;
        this.musicSource.loop = true;
        this.musicSource.connect(this.musicGainNode);
        this.musicSource.start();
        this.isMusicPlaying = true;
    }

    stopMusic(): void {
        if (this.musicSource) {
            try {
                this.musicSource.stop();
            } catch {
                // Ignore if already stopped
            }
            this.musicSource = null;
        }
        this.isMusicPlaying = false;
    }

    pauseMusic(): void {
        if (this.audioContext && this.isMusicPlaying) {
            this.audioContext.suspend();
        }
    }

    resumeMusic(): void {
        if (this.audioContext && this.isMusicPlaying) {
            this.audioContext.resume();
        }
    }

    toggleSound(): boolean {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    toggleMusic(): boolean {
        this.musicEnabled = !this.musicEnabled;
        if (!this.musicEnabled) {
            this.stopMusic();
        }
        return this.musicEnabled;
    }

    setSoundEnabled(enabled: boolean): void {
        this.soundEnabled = enabled;
    }

    setMusicEnabled(enabled: boolean): void {
        this.musicEnabled = enabled;
        if (!enabled) {
            this.stopMusic();
        }
    }
}

export const audioManager = new AudioManager();
