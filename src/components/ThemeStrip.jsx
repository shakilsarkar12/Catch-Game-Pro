'use client';

export const THEMES = {
    animals: { items: ['🐶', '🐱', '🐸', '🦊', '🐼', '🐨', '🦁', '🐯', '🐺', '🦝'], special: '🦄', danger: '🐍' },
    food: { items: ['🍕', '🍔', '🌮', '🍜', '🍣', '🍩', '🍦', '🥑', '🧁', '🌯'], special: '🍱', danger: '🌶️' },
    space: { items: ['🚀', '🛸', '🌙', '⭐', '🪐', '☄️', '🌌', '🛰️', '🌟', '💫'], special: '👾', danger: '💣' },
    weather: { items: ['⛅', '🌈', '❄️', '🌊', '🌪️', '🔥', '💧', '🌙', '☀️', '🌤️'], special: '🌏', danger: '⚡' },
    sports: { items: ['⚽', '🏀', '🎯', '🏆', '🎾', '🏓', '⚾', '🏈', '🎱', '🥊'], special: '🏅', danger: '🗡️' },
};

export default function ThemeStrip({ theme, setTheme, gameRunning }) {
    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div id="theme-strip">
            <span className="th-label">Theme</span>
            {Object.keys(THEMES).map(t => (
                <button 
                    key={t}
                    className={`theme-btn ${theme === t ? 'active' : ''}`} 
                    onClick={() => handleThemeChange(t)}
                >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
            ))}
        </div>
    );
}
