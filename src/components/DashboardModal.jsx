'use client';
import { useAuth } from '@/context/AuthContext';

export default function DashboardModal({ isOpen, onClose }) {
    const { currentUser, userProfile, bestScore } = useAuth();

    if (!isOpen || !currentUser || !userProfile) return null;

    const name = userProfile.profile?.name || 'Player';
    const photo = userProfile.profile?.photoURL;
    const tier = userProfile.progression?.rankTier || 'bronze';
    
    const xp = userProfile.progression?.xp || 0;
    const level = userProfile.progression?.level || 1;
    const xpForNext = level * 500;
    const xpInLevel = xp - ((level - 1) * 500);
    const pct = Math.min(100, Math.round((xpInLevel / 500) * 100));
    const s = userProfile.stats || {};

    return (
        <div id="dashboard-modal" className="modal-overlay" onClick={onClose}>
            <div className="modal-content panel dashboard-panel" onClick={e => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>×</button>
                
                <div className="dash-header">
                    <div className="dash-avatar">
                        {photo ? <img src={photo} alt="" /> : name[0].toUpperCase()}
                    </div>
                    <div className="dash-user-info">
                        <h2>{name}</h2>
                        <div className={`user-rank rank-${tier}`}>{tier.toUpperCase()}</div>
                    </div>
                </div>

                <div className="dash-section">
                    <div className="panel-title">Progression</div>
                    <div className="xp-wrap" style={{ marginTop: '8px' }}>
                        <div className="xp-row">
                            <span className="xp-level">Lv. {level}</span>
                            <span className="xp-label">{xp} / {xpForNext} XP</span>
                        </div>
                        <div className="xp-bar-bg" style={{ height: '8px', marginTop: '6px' }}>
                            <div className="xp-bar-fill" style={{ width: `${pct}%`, height: '8px' }}></div>
                        </div>
                    </div>
                </div>

                <div className="dash-section">
                    <div className="panel-title">Career Statistics</div>
                    <div className="dash-stats-grid">
                        <div className="dash-stat-box">
                            <div className="dash-stat-val lime">{bestScore}</div>
                            <div className="dash-stat-label">BEST SCORE</div>
                        </div>
                        <div className="dash-stat-box">
                            <div className="dash-stat-val cyan">{s.totalGames || 0}</div>
                            <div className="dash-stat-label">GAMES PLAYED</div>
                        </div>
                        <div className="dash-stat-box">
                            <div className="dash-stat-val gold">{s.accuracy || 0}%</div>
                            <div className="dash-stat-label">ACCURACY</div>
                        </div>
                        <div className="dash-stat-box">
                            <div className="dash-stat-val">{s.totalHits || 0}</div>
                            <div className="dash-stat-label">TOTAL HITS</div>
                        </div>
                        <div className="dash-stat-box">
                            <div className="dash-stat-val pink">{s.totalMisses || 0}</div>
                            <div className="dash-stat-label">TOTAL MISSES</div>
                        </div>
                        <div className="dash-stat-box">
                            <div className="dash-stat-val">{userProfile.streak?.best || 0}</div>
                            <div className="dash-stat-label">BEST STREAK</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
