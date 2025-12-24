// Tetromino definitions with SRS rotation system

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Tetromino {
    type: TetrominoType;
    shape: number[][];
    color: string;
    glowColor: string;
}

// Shape matrices for each rotation state (0, 90, 180, 270 degrees)
// 1 represents a filled cell, 0 is empty

export const TETROMINOES: Record<TetrominoType, { shapes: number[][][]; color: string; glowColor: string }> = {
    I: {
        shapes: [
            [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
            [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
            [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
            [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
        ],
        color: '#00E5FF',
        glowColor: 'rgba(0, 229, 255, 0.8)',
    },
    O: {
        shapes: [
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
            [[1, 1], [1, 1]],
        ],
        color: '#FFEB3B',
        glowColor: 'rgba(255, 235, 59, 0.8)',
    },
    T: {
        shapes: [
            [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
            [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
        ],
        color: '#BA68C8',
        glowColor: 'rgba(186, 104, 200, 0.8)',
    },
    S: {
        shapes: [
            [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
            [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
            [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
        ],
        color: '#66BB6A',
        glowColor: 'rgba(102, 187, 106, 0.8)',
    },
    Z: {
        shapes: [
            [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
            [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
            [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
        ],
        color: '#FF5252',
        glowColor: 'rgba(255, 82, 82, 0.8)',
    },
    J: {
        shapes: [
            [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
            [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
            [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
        ],
        color: '#42A5F5',
        glowColor: 'rgba(66, 165, 245, 0.8)',
    },
    L: {
        shapes: [
            [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
            [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
            [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
            [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
        ],
        color: '#FFA726',
        glowColor: 'rgba(255, 167, 38, 0.8)',
    },
};

// Wall kick data for SRS rotation (J, L, S, T, Z pieces)
export const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
    '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
};

// Wall kick data for I piece
export const WALL_KICKS_I: Record<string, [number, number][]> = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
};

// 7-bag random generation
export class TetrominoBag {
    private bag: TetrominoType[] = [];
    private nextBag: TetrominoType[] = [];

    constructor() {
        this.fillBag();
        this.fillNextBag();
    }

    private shuffleArray<T>(array: T[]): T[] {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private fillBag(): void {
        const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        this.bag = this.shuffleArray(pieces);
    }

    private fillNextBag(): void {
        const pieces: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        this.nextBag = this.shuffleArray(pieces);
    }

    next(): TetrominoType {
        if (this.bag.length === 0) {
            this.bag = this.nextBag;
            this.fillNextBag();
        }
        return this.bag.pop()!;
    }

    peek(): TetrominoType {
        if (this.bag.length === 0) {
            return this.nextBag[this.nextBag.length - 1];
        }
        return this.bag[this.bag.length - 1];
    }

    reset(): void {
        this.fillBag();
        this.fillNextBag();
    }
}

export function createTetromino(type: TetrominoType): Tetromino {
    const data = TETROMINOES[type];
    return {
        type,
        shape: data.shapes[0],
        color: data.color,
        glowColor: data.glowColor,
    };
}

export function getRotatedShape(type: TetrominoType, rotation: number): number[][] {
    return TETROMINOES[type].shapes[rotation % 4];
}

export function getWallKicks(type: TetrominoType, fromRotation: number, toRotation: number): [number, number][] {
    const key = `${fromRotation}>${toRotation}`;
    if (type === 'I') {
        return WALL_KICKS_I[key] || [[0, 0]];
    }
    if (type === 'O') {
        return [[0, 0]]; // O piece doesn't need wall kicks
    }
    return WALL_KICKS_JLSTZ[key] || [[0, 0]];
}
