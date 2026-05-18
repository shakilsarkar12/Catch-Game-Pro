'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

export default function RightPanel({ lives, combo, score, hits, misses, multiplier, diff, streak }) {
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
            <div className="how-item"><div className="how-num">4</div><span>💀 Danger changes each game (Avoid it!)</span></div>
            <div className="how-item"><div className="how-num">5</div><span>Miss 3× = game over instantly</span></div>

        </div>
    );
}
