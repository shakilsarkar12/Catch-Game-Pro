'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function RightPanel({ lives, combo, score, hits, misses, multiplier, diff, streak }) {
    const { currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'leaderboard'), orderBy('bestScore', 'desc'), limit(10));
        const unsubscribe = onSnapshot(q, (snap) => {
            const entries = [];
            snap.forEach(d => entries.push(d.data()));
            setLeaderboard(entries);
            setLoading(false);
        }, (error) => {
            console.error("Leaderboard error: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const medals = ['🥇', '🥈', '🥉'];

    return (
        <div className="right-panel panel">
            <div className="panel-title">This Round</div>
            <div className="lives-row">
                {[0, 1, 2].map(i => (
                    <div key={i} className={`life-icon ${i >= lives ? 'lost' : ''}`}>❤️</div>
                ))}
            </div>

            <div className="combo-wrap">
                <div className={`combo-badge cb-${multiplier}`}>×{multiplier}</div>
                <div className="streak-dots">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className={`s-dot ${i < Math.min(streak, 10) ? 'lit' : ''}`}></div>
                    ))}
                </div>
            </div>

            <div className="stat-item"><span className="stat-k">Score</span><span className="stat-v lime">{score}</span></div>
            <div className="stat-item"><span className="stat-k">Hits</span><span className="stat-v cyan">{hits}</span></div>
            <div className="stat-item"><span className="stat-k">Misses</span><span className="stat-v pink">{misses}</span></div>
            <div className="stat-item"><span className="stat-k">Multiplier</span><span className="stat-v gold">×{multiplier}</span></div>

            <div className="panel-title" style={{ marginTop: '4px' }}>Difficulty</div>
            <div className="diff-bar">
                {[0, 1, 2, 3].map(i => {
                    const cls = ['', 'a1', 'a2', 'a3', 'a4'];
                    const isActive = i < diff.seg;
                    return <div key={i} className={`diff-seg ${isActive ? cls[diff.seg] : ''}`}></div>;
                })}
            </div>

            <div className="panel-title" style={{ marginTop: '4px' }}>How to Play</div>
            <div className="how-item"><div className="how-num">1</div><span>Click the moving icon to score</span></div>
            <div className="how-item"><div className="how-num">2</div><span>3-streak → ×2, 5 → ×3, 8 → ×4</span></div>
            <div className="how-item"><div className="how-num">3</div><span>⭐ Special = 3× your multiplier</span></div>
            <div className="how-item"><div className="how-num">4</div><span>💀 Danger icon = −1 life if clicked</span></div>
            <div className="how-item"><div className="how-num">5</div><span>Miss 3× = game over instantly</span></div>

            <div className="panel-title" style={{ marginTop: '4px' }}>Leaderboard</div>
            <div id="lb-wrap">
                {loading ? <div className="lb-loading">Loading...</div> : 
                 leaderboard.length === 0 ? <div className="lb-loading">No scores yet. Be first!</div> :
                 leaderboard.map((e, i) => {
                     const isYou = currentUser && e.uid === currentUser.uid;
                     const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
                     const rankDisp = i < 3 ? medals[i] : (i + 1);
                     return (
                         <div key={e.uid || i} className="lb-entry">
                             <div className={`lb-rank ${rankClass}`}>{rankDisp}</div>
                             <div className="lb-avatar">
                                 {e.photoURL ? <img src={e.photoURL} alt="" /> : <span>{(e.name || '?')[0].toUpperCase()}</span>}
                             </div>
                             <div className={`lb-name ${isYou ? 'lb-you' : ''}`}>
                                 {e.name || 'Player'}{isYou ? ' ★' : ''}
                             </div>
                             <div className="lb-score">{e.bestScore || 0}</div>
                         </div>
                     );
                 })
                }
            </div>
        </div>
    );
}
