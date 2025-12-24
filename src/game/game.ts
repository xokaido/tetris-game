// Main Tetris Game Engine

import type { TetrominoType } from './tetromino';
import { TetrominoBag, TETROMINOES, getRotatedShape, getWallKicks } from './tetromino';
import { audioManager } from './audio';
import { getSettings, saveSettings, saveHighScore, getTopScore, isHighScore, type GameSettings } from '../utils/storage';
import { translations, type Language, type Translations } from '../i18n/translations';

// Game constants
const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 20;

// Scoring
const SCORE_TABLE: Record<number, number> = {
    1: 100,
    2: 300,
    3: 500,
    4: 800,
};

// Speed levels (milliseconds per drop)
const BASE_SPEED = 1000;
const SPEED_DECREASE_PER_LEVEL = 75;
const MIN_SPEED = 100;

interface ActivePiece {
    type: TetrominoType;
    x: number;
    y: number;
    rotation: number;
}

type GameState = 'start' | 'playing' | 'paused' | 'gameover';

class TetrisGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private previewCanvas: HTMLCanvasElement;
    private previewCtx: CanvasRenderingContext2D;

    private board: (string | null)[][];
    private currentPiece: ActivePiece | null = null;
    private bag: TetrominoBag;
    private nextPiece: TetrominoType;

    private score = 0;
    private level = 1;
    private lines = 0;
    private highScore = 0;

    private state: GameState = 'start';
    private lastDrop = 0;
    private dropInterval = BASE_SPEED;

    private settings: GameSettings;
    private t: Translations;

    // Touch handling
    private touchStartX = 0;
    private touchStartY = 0;
    private touchStartTime = 0;
    private lastTapTime = 0;

    // Animation
    private particles: Particle[] = [];

    constructor() {
        this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d')!;
        this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
        this.previewCtx = this.previewCanvas.getContext('2d')!;

        this.canvas.width = COLS * CELL_SIZE;
        this.canvas.height = ROWS * CELL_SIZE;
        this.previewCanvas.width = 4 * PREVIEW_CELL_SIZE;
        this.previewCanvas.height = 4 * PREVIEW_CELL_SIZE;

        this.board = this.createEmptyBoard();
        this.bag = new TetrominoBag();
        this.nextPiece = this.bag.next();

        this.settings = getSettings();
        this.t = translations[this.settings.language];
        this.highScore = getTopScore();

        this.setupEventListeners();
        this.applySettings();
        this.updateUI();
        this.render();
    }

    private createEmptyBoard(): (string | null)[][] {
        return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    }

    async init(): Promise<void> {
        await audioManager.init();
        audioManager.setSoundEnabled(this.settings.soundEnabled);
        audioManager.setMusicEnabled(this.settings.musicEnabled);
        this.updateSettingsUI();
    }

    private setupEventListeners(): void {
        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));

        // Touch controls
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // Button events
        document.getElementById('start-btn')?.addEventListener('click', () => this.startGame());
        document.getElementById('pause-btn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('restart-btn')?.addEventListener('click', () => this.startGame());

        // Settings
        document.getElementById('sound-toggle')?.addEventListener('click', () => this.toggleSound());
        document.getElementById('music-toggle')?.addEventListener('click', () => this.toggleMusic());

        // Language selection
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lang = (e.target as HTMLElement).dataset.lang as Language;
                if (lang) this.setLanguage(lang);
            });
        });

        // Game over modal
        document.getElementById('play-again-btn')?.addEventListener('click', () => {
            this.hideGameOverModal();
            this.startGame();
        });
    }

    private handleKeyDown(e: KeyboardEvent): void {
        if (this.state !== 'playing') {
            if (e.key === 'Enter' && (this.state === 'start' || this.state === 'gameover')) {
                this.startGame();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowLeft':
                this.movePiece(-1, 0);
                e.preventDefault();
                break;
            case 'ArrowRight':
                this.movePiece(1, 0);
                e.preventDefault();
                break;
            case 'ArrowDown':
                this.softDrop();
                e.preventDefault();
                break;
            case 'ArrowUp':
                this.rotatePiece();
                e.preventDefault();
                break;
            case ' ':
                this.hardDrop();
                e.preventDefault();
                break;
            case 'p':
            case 'P':
            case 'Escape':
                this.togglePause();
                e.preventDefault();
                break;
        }
    }

    private handleTouchStart(e: TouchEvent): void {
        if (this.state !== 'playing') return;
        e.preventDefault();

        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.touchStartY = touch.clientY;
        this.touchStartTime = Date.now();
    }

    private handleTouchMove(e: TouchEvent): void {
        if (this.state !== 'playing') return;
        e.preventDefault();
    }

    private handleTouchEnd(e: TouchEvent): void {
        if (this.state !== 'playing') return;
        e.preventDefault();

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - this.touchStartX;
        const deltaY = touch.clientY - this.touchStartY;
        const deltaTime = Date.now() - this.touchStartTime;

        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        // Tap detection (minimal movement, quick touch)
        if (absX < 15 && absY < 15 && deltaTime < 200) {
            const now = Date.now();
            if (now - this.lastTapTime < 300) {
                // Double tap = hard drop
                this.hardDrop();
            } else {
                // Single tap = rotate
                this.rotatePiece();
            }
            this.lastTapTime = now;
            return;
        }

        // Swipe detection
        const minSwipe = 30;

        if (absX > absY && absX > minSwipe) {
            // Horizontal swipe
            const steps = Math.max(1, Math.floor(absX / 40));
            for (let i = 0; i < steps; i++) {
                this.movePiece(deltaX > 0 ? 1 : -1, 0);
            }
        } else if (absY > absX && absY > minSwipe) {
            if (deltaY > 0) {
                // Swipe down = soft drop or hard drop based on speed
                if (absY > 100 && deltaTime < 150) {
                    this.hardDrop();
                } else {
                    this.softDrop();
                }
            }
        }
    }

    private movePiece(dx: number, dy: number): boolean {
        if (!this.currentPiece) return false;

        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;

        if (this.isValidPosition(this.currentPiece.type, newX, newY, this.currentPiece.rotation)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            if (dx !== 0) audioManager.play('move');
            return true;
        }
        return false;
    }

    private rotatePiece(): void {
        if (!this.currentPiece) return;

        const fromRotation = this.currentPiece.rotation;
        const toRotation = (fromRotation + 1) % 4;
        const kicks = getWallKicks(this.currentPiece.type, fromRotation, toRotation);

        for (const [kickX, kickY] of kicks) {
            const newX = this.currentPiece.x + kickX;
            const newY = this.currentPiece.y - kickY; // Y is inverted in our coordinate system

            if (this.isValidPosition(this.currentPiece.type, newX, newY, toRotation)) {
                this.currentPiece.x = newX;
                this.currentPiece.y = newY;
                this.currentPiece.rotation = toRotation;
                audioManager.play('rotate');
                return;
            }
        }
    }

    private softDrop(): void {
        if (this.movePiece(0, 1)) {
            this.score += 1;
            this.updateScoreDisplay();
        }
    }

    private hardDrop(): void {
        if (!this.currentPiece) return;

        let dropDistance = 0;
        while (this.movePiece(0, 1)) {
            dropDistance++;
        }
        this.score += dropDistance * 2;
        this.updateScoreDisplay();
        this.lockPiece();
        audioManager.play('drop');
    }

    private isValidPosition(type: TetrominoType, x: number, y: number, rotation: number): boolean {
        const shape = getRotatedShape(type, rotation);

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardX = x + col;
                    const boardY = y + row;

                    // Check bounds
                    if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                        return false;
                    }

                    // Check collision with existing pieces (ignore if above board)
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    private lockPiece(): void {
        if (!this.currentPiece) return;

        const shape = getRotatedShape(this.currentPiece.type, this.currentPiece.rotation);
        const color = TETROMINOES[this.currentPiece.type].color;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = this.currentPiece.y + row;
                    const boardX = this.currentPiece.x + col;

                    if (boardY >= 0 && boardY < ROWS && boardX >= 0 && boardX < COLS) {
                        this.board[boardY][boardX] = color;
                    }
                }
            }
        }

        this.clearLines();
        this.spawnPiece();
    }

    private clearLines(): void {
        const linesToClear: number[] = [];

        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== null)) {
                linesToClear.push(row);
            }
        }

        if (linesToClear.length === 0) return;

        // Add score
        const lineScore = SCORE_TABLE[linesToClear.length] || 0;
        this.score += lineScore * this.level;
        this.lines += linesToClear.length;

        // Create particles for cleared lines
        for (const row of linesToClear) {
            this.createLineClearParticles(row);
        }

        // Play sound
        if (linesToClear.length === 4) {
            audioManager.play('tetris');
        } else {
            audioManager.play('clear');
        }

        // Actually clear the lines
        for (const row of linesToClear) {
            this.board.splice(row, 1);
            this.board.unshift(Array(COLS).fill(null));
        }

        // Check for level up
        const newLevel = Math.floor(this.lines / 10) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.dropInterval = Math.max(MIN_SPEED, BASE_SPEED - (this.level - 1) * SPEED_DECREASE_PER_LEVEL);
            audioManager.play('levelup');
        }

        this.updateUI();
    }

    private createLineClearParticles(row: number): void {
        for (let col = 0; col < COLS; col++) {
            const color = this.board[row][col];
            if (color) {
                for (let i = 0; i < 3; i++) {
                    this.particles.push({
                        x: col * CELL_SIZE + CELL_SIZE / 2,
                        y: row * CELL_SIZE + CELL_SIZE / 2,
                        vx: (Math.random() - 0.5) * 8,
                        vy: (Math.random() - 0.5) * 8 - 2,
                        color: color,
                        life: 1,
                        decay: 0.02 + Math.random() * 0.02,
                    });
                }
            }
        }
    }

    private spawnPiece(): void {
        const type = this.nextPiece;
        const startX = Math.floor((COLS - 4) / 2);
        const startY = 0;

        this.nextPiece = this.bag.next();
        this.renderPreview();

        // Check if piece can spawn at row 0
        if (!this.isValidPosition(type, startX, startY, 0)) {
            // Can't spawn - game over
            this.currentPiece = null;
            this.gameOver();
            return;
        }

        this.currentPiece = {
            type,
            x: startX,
            y: startY,
            rotation: 0,
        };
    }

    private gameOver(): void {
        this.state = 'gameover';
        audioManager.stopMusic();
        audioManager.play('gameover');

        const isNewHigh = isHighScore(this.score);
        if (isNewHigh) {
            saveHighScore({
                score: this.score,
                level: this.level,
                lines: this.lines,
                date: new Date().toISOString(),
            });
            this.highScore = this.score;
            this.updateHighScoreDisplay();
        }

        this.showGameOverModal(isNewHigh);
    }

    private showGameOverModal(isNewHighScore: boolean): void {
        const modal = document.getElementById('gameover-modal')!;
        const finalScore = document.getElementById('final-score')!;
        const finalLevel = document.getElementById('final-level')!;
        const finalLines = document.getElementById('final-lines')!;
        const highScoreText = document.getElementById('new-highscore')!;

        finalScore.textContent = this.score.toLocaleString();
        finalLevel.textContent = String(this.level);
        finalLines.textContent = String(this.lines);
        highScoreText.style.display = isNewHighScore ? 'block' : 'none';

        modal.classList.add('show');
    }

    private hideGameOverModal(): void {
        document.getElementById('gameover-modal')!.classList.remove('show');
    }

    startGame(): void {
        this.board = this.createEmptyBoard();
        this.bag.reset();
        this.nextPiece = this.bag.next();
        this.currentPiece = null;
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.dropInterval = BASE_SPEED;
        this.particles = [];

        this.spawnPiece();
        this.state = 'playing';
        this.lastDrop = performance.now();

        this.hideGameOverModal();
        this.updateUI();
        this.updatePauseButton();

        audioManager.startMusic();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    private togglePause(): void {
        if (this.state === 'playing') {
            this.state = 'paused';
            audioManager.pauseMusic();
            this.render(); // Render once to show pause overlay with pieces visible
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.lastDrop = performance.now();
            audioManager.resumeMusic();
            requestAnimationFrame((t) => this.gameLoop(t));
        }
        this.updatePauseButton();
    }

    private updatePauseButton(): void {
        const pauseBtn = document.getElementById('pause-btn')!;
        pauseBtn.textContent = this.state === 'paused' ? this.t.resume : this.t.pause;
        pauseBtn.style.display = this.state === 'playing' || this.state === 'paused' ? 'inline-block' : 'none';
    }

    private gameLoop(timestamp: number): void {
        if (this.state !== 'playing') return;

        // Auto-drop
        if (timestamp - this.lastDrop > this.dropInterval) {
            if (!this.movePiece(0, 1)) {
                this.lockPiece();
            }
            this.lastDrop = timestamp;
        }

        this.updateParticles();
        this.render();

        if (this.state === 'playing') {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    private updateParticles(): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.3; // gravity
            p.life -= p.decay;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    private render(): void {
        const ctx = this.ctx;

        // Clear canvas with lighter background for visibility
        ctx.fillStyle = '#1e1e3f';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= COLS; x++) {
            ctx.beginPath();
            ctx.moveTo(x * CELL_SIZE, 0);
            ctx.lineTo(x * CELL_SIZE, ROWS * CELL_SIZE);
            ctx.stroke();
        }
        for (let y = 0; y <= ROWS; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * CELL_SIZE);
            ctx.lineTo(COLS * CELL_SIZE, y * CELL_SIZE);
            ctx.stroke();
        }

        // Draw locked pieces
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                const color = this.board[row][col];
                if (color) {
                    this.drawCell(ctx, col, row, color);
                }
            }
        }

        // Draw ghost piece
        if (this.currentPiece && this.state === 'playing') {
            this.drawGhostPiece();
        }

        // Draw current piece
        if (this.currentPiece) {
            this.drawCurrentPiece();
        }

        // Draw particles
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        // Draw pause overlay
        if (this.state === 'paused') {
            ctx.fillStyle = 'rgba(0, 0, 20, 0.5)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#00f5ff';
            ctx.font = 'bold 24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.t.pause, this.canvas.width / 2, this.canvas.height / 2);
        }

        // Draw start screen
        if (this.state === 'start') {
            ctx.fillStyle = 'rgba(0, 0, 20, 0.6)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#00f5ff';
            ctx.font = 'bold 20px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.t.title, this.canvas.width / 2, this.canvas.height / 2 - 30);
            ctx.fillStyle = '#fff';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText(this.t.start, this.canvas.width / 2, this.canvas.height / 2 + 20);
        }
    }

    private drawCell(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, alpha = 1): void {
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;
        const size = CELL_SIZE - 2;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Main block - bright solid color
        ctx.fillStyle = color;
        ctx.fillRect(px + 1, py + 1, size, size);

        // Light border on top and left (3D effect)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(px + 1, py + 1, size, 3);
        ctx.fillRect(px + 1, py + 1, 3, size);

        // Dark border on bottom and right (3D effect)  
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(px + 1, py + size - 2, size, 3);
        ctx.fillRect(px + size - 2, py + 1, 3, size);

        ctx.restore();
    }

    private drawCurrentPiece(): void {
        if (!this.currentPiece) return;

        const shape = getRotatedShape(this.currentPiece.type, this.currentPiece.rotation);
        const color = TETROMINOES[this.currentPiece.type].color;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const y = this.currentPiece.y + row;
                    if (y >= 0) {
                        this.drawCell(this.ctx, this.currentPiece.x + col, y, color);
                    }
                }
            }
        }
    }

    private drawGhostPiece(): void {
        if (!this.currentPiece) return;

        // Find ghost position
        let ghostY = this.currentPiece.y;
        while (this.isValidPosition(this.currentPiece.type, this.currentPiece.x, ghostY + 1, this.currentPiece.rotation)) {
            ghostY++;
        }

        if (ghostY === this.currentPiece.y) return;

        const shape = getRotatedShape(this.currentPiece.type, this.currentPiece.rotation);
        const color = TETROMINOES[this.currentPiece.type].color;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const y = ghostY + row;
                    if (y >= 0) {
                        this.drawCell(this.ctx, this.currentPiece.x + col, y, color, 0.3);
                    }
                }
            }
        }
    }

    private renderPreview(): void {
        const ctx = this.previewCtx;

        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);

        const shape = getRotatedShape(this.nextPiece, 0);
        const color = TETROMINOES[this.nextPiece].color;

        // Center the piece
        const offsetX = (4 - shape[0].length) / 2;
        const offsetY = (4 - shape.length) / 2;

        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const px = (offsetX + col) * PREVIEW_CELL_SIZE + 1;
                    const py = (offsetY + row) * PREVIEW_CELL_SIZE + 1;
                    const size = PREVIEW_CELL_SIZE - 2;

                    ctx.shadowColor = color;
                    ctx.shadowBlur = 6;
                    ctx.fillStyle = color;
                    ctx.fillRect(px, py, size, size);
                    ctx.shadowBlur = 0;
                }
            }
        }
    }

    private updateUI(): void {
        this.updateScoreDisplay();
        document.getElementById('level-value')!.textContent = String(this.level);
        document.getElementById('lines-value')!.textContent = String(this.lines);
        this.updateHighScoreDisplay();
        this.renderPreview();
    }

    private updateScoreDisplay(): void {
        document.getElementById('score-value')!.textContent = this.score.toLocaleString();
    }

    private updateHighScoreDisplay(): void {
        document.getElementById('highscore-value')!.textContent = this.highScore.toLocaleString();
    }

    private applySettings(): void {
        this.t = translations[this.settings.language];
        this.updateLanguageUI();
        this.updateSettingsUI();
    }

    private updateLanguageUI(): void {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n') as keyof Translations;
            if (key && this.t[key]) {
                el.textContent = this.t[key];
            }
        });

        // Update active language button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === this.settings.language);
        });

        this.updatePauseButton();
    }

    private updateSettingsUI(): void {
        const soundBtn = document.getElementById('sound-toggle')!;
        const musicBtn = document.getElementById('music-toggle')!;

        soundBtn.textContent = `${this.t.sound}: ${this.settings.soundEnabled ? this.t.on : this.t.off}`;
        musicBtn.textContent = `${this.t.music}: ${this.settings.musicEnabled ? this.t.on : this.t.off}`;

        soundBtn.classList.toggle('active', this.settings.soundEnabled);
        musicBtn.classList.toggle('active', this.settings.musicEnabled);
    }

    private setLanguage(lang: Language): void {
        this.settings.language = lang;
        saveSettings(this.settings);
        this.applySettings();
    }

    private toggleSound(): void {
        this.settings.soundEnabled = audioManager.toggleSound();
        saveSettings(this.settings);
        this.updateSettingsUI();
    }

    private toggleMusic(): void {
        this.settings.musicEnabled = audioManager.toggleMusic();
        if (this.settings.musicEnabled && this.state === 'playing') {
            audioManager.startMusic();
        }
        saveSettings(this.settings);
        this.updateSettingsUI();
    }
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    life: number;
    decay: number;
}

// Initialize game
let game: TetrisGame;

document.addEventListener('DOMContentLoaded', async () => {
    game = new TetrisGame();
    await game.init();
});

export { TetrisGame };
