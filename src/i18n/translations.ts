// Internationalization translations

export interface Translations {
    title: string;
    score: string;
    level: string;
    lines: string;
    next: string;
    highScore: string;
    start: string;
    restart: string;
    pause: string;
    resume: string;
    gameOver: string;
    newHighScore: string;
    controls: string;
    controlsDesc: string;
    tapToRotate: string;
    swipeToMove: string;
    swipeDownToDrop: string;
    settings: string;
    language: string;
    sound: string;
    music: string;
    on: string;
    off: string;
    language_en: string;
    language_ru: string;
    language_ka: string;
}

export type Language = 'en' | 'ru' | 'ka';

export const translations: Record<Language, Translations> = {
    en: {
        title: 'TETRIS',
        score: 'Score',
        level: 'Level',
        lines: 'Lines',
        next: 'Next',
        highScore: 'High Score',
        start: 'Start Game',
        restart: 'Restart',
        pause: 'Pause',
        resume: 'Resume',
        gameOver: 'Game Over',
        newHighScore: 'New High Score!',
        controls: 'Controls',
        controlsDesc: '← → Move | ↑ Rotate | ↓ Soft Drop | Space Hard Drop | P Pause',
        tapToRotate: 'Tap to rotate',
        swipeToMove: 'Swipe to move',
        swipeDownToDrop: 'Swipe down to drop',
        settings: 'Settings',
        language: 'Language',
        sound: 'Sound Effects',
        music: 'Music',
        on: 'ON',
        off: 'OFF',
        language_en: 'English',
        language_ru: 'Русский',
        language_ka: 'ქართული',
    },
    ru: {
        title: 'ТЕТРИС',
        score: 'Очки',
        level: 'Уровень',
        lines: 'Линии',
        next: 'Следующая',
        highScore: 'Рекорд',
        start: 'Начать игру',
        restart: 'Заново',
        pause: 'Пауза',
        resume: 'Продолжить',
        gameOver: 'Игра окончена',
        newHighScore: 'Новый рекорд!',
        controls: 'Управление',
        controlsDesc: '← → Движение | ↑ Поворот | ↓ Опустить | Пробел Сбросить | P Пауза',
        tapToRotate: 'Нажмите для поворота',
        swipeToMove: 'Проведите для движения',
        swipeDownToDrop: 'Проведите вниз для сброса',
        settings: 'Настройки',
        language: 'Язык',
        sound: 'Звуковые эффекты',
        music: 'Музыка',
        on: 'ВКЛ',
        off: 'ВЫКЛ',
        language_en: 'English',
        language_ru: 'Русский',
        language_ka: 'ქართული',
    },
    ka: {
        title: 'ტეტრისი',
        score: 'ქულა',
        level: 'დონე',
        lines: 'ხაზები',
        next: 'შემდეგი',
        highScore: 'რეკორდი',
        start: 'თამაშის დაწყება',
        restart: 'თავიდან',
        pause: 'პაუზა',
        resume: 'გაგრძელება',
        gameOver: 'თამაში დასრულდა',
        newHighScore: 'ახალი რეკორდი!',
        controls: 'მართვა',
        controlsDesc: '← → გადაადგილება | ↑ შემობრუნება | ↓ ჩამოშვება | Space სწრაფად | P პაუზა',
        tapToRotate: 'შეეხეთ შესაბრუნებლად',
        swipeToMove: 'გადაასრიალეთ გადასაადგილებლად',
        swipeDownToDrop: 'გადაასრიალეთ ქვემოთ ჩამოსაშვებად',
        settings: 'პარამეტრები',
        language: 'ენა',
        sound: 'ხმოვანი ეფექტები',
        music: 'მუსიკა',
        on: 'ჩართ.',
        off: 'გამორთ.',
        language_en: 'English',
        language_ru: 'Русский',
        language_ka: 'ქართული',
    },
};

export function getTranslation(lang: Language): Translations {
    return translations[lang];
}
