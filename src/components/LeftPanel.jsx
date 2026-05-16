'use client';
import { useAuth } from '@/context/AuthContext';

export default function LeftPanel() {
    const { userProfile, bestScore } = useAuth();

    if (!userProfile) {
        return (
            <div className="left-panel panel" id="left-panel">
                <div className="panel-title">Progression</div>
                <div style={{fontSize: '12px', color: 'var(--muted)'}}>Sign in to view progression</div>
            </div>
        );
    }

    const xp = userProfile.progression?.xp || 0;
    const level = userProfile.progression?.level || 1;
    const tier = userProfile.progression?.rankTier || 'bronze';
    const xpForNext = level * 500;
    const xpInLevel = xp - ((level - 1) * 500);
    const pct = Math.min(100, Math.round((xpInLevel / 500) * 100));
    const s = userProfile.stats || {};

    return (
        <div className="left-panel panel" id="left-panel">
            <div className="panel-title">Progression</div>
            <div className="xp-wrap">
                <div className="xp-row">
                    <span className="xp-level">{level}</span>
                    <span className="xp-label">{xp} / {xpForNext} XP</span>
                </div>
                <div className="xp-bar-bg">
                    <div className="xp-bar-fill" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="xp-label" style={{ marginTop: '2px' }}>
                    Rank: {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </div>
            </div>

            <div className="panel-title" style={{ marginTop: '4px' }}>Career Stats</div>
            <div className="stat-item"><span className="stat-k">Best Score</span><span className="stat-v lime">{bestScore}</span></div>
            <div className="stat-item"><span className="stat-k">Total Games</span><span className="stat-v cyan">{s.totalGames || 0}</span></div>
            <div className="stat-item"><span className="stat-k">Total Hits</span><span className="stat-v">{s.totalHits || 0}</span></div>
            <div className="stat-item"><span className="stat-k">Accuracy</span><span className="stat-v gold">{s.accuracy || 0}%</span></div>
            <div className="stat-item"><span className="stat-k">Best Streak</span><span className="stat-v">{userProfile.streak?.best || 0}</span></div>
        </div>
    );
}
