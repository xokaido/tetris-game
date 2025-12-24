// Local storage utility for high scores and settings

export interface GameScore {
    score: number;
    level: number;
    lines: number;
    date: string;
}

export interface GameSettings {
    language: 'en' | 'ru' | 'ka';
    soundEnabled: boolean;
    musicEnabled: boolean;
}

const SCORES_KEY = 'tetris_highscores';
const SETTINGS_KEY = 'tetris_settings';
const MAX_SCORES = 10;

export function getHighScores(): GameScore[] {
    try {
        const data = localStorage.getItem(SCORES_KEY);
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
}

export function saveHighScore(score: GameScore): boolean {
    const scores = getHighScores();
    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    const topScores = scores.slice(0, MAX_SCORES);

    try {
        localStorage.setItem(SCORES_KEY, JSON.stringify(topScores));
        // Return true if this score made it to the leaderboard
        return topScores.some(s => s.score === score.score && s.date === score.date);
    } catch {
        return false;
    }
}

export function getTopScore(): number {
    const scores = getHighScores();
    return scores.length > 0 ? scores[0].score : 0;
}

export function isHighScore(score: number): boolean {
    const scores = getHighScores();
    if (scores.length < MAX_SCORES) return true;
    return score > scores[scores.length - 1].score;
}

export function getSettings(): GameSettings {
    try {
        const data = localStorage.getItem(SETTINGS_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch {
        // Fall through to default
    }

    // Default settings
    return {
        language: 'en',
        soundEnabled: true,
        musicEnabled: true,
    };
}

export function saveSettings(settings: GameSettings): void {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
        console.warn('Failed to save settings');
    }
}
