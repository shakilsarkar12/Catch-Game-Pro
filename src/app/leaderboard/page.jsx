'use client';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function LeaderboardPage() {
    const { currentUser } = useAuth();
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'leaderboard'), orderBy('bestScore', 'desc'), limit(50));
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
        <div className="page" style={{ padding: '40px 20px' }}>
            <div className="glow-tl"></div>
            <div className="glow-br"></div>

            <div style={{ maxWidth: '600px', width: '100%', marginBottom: '20px' }}>
                <Link href="/" className="btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                    <span>◀</span> Back to Game
                </Link>
            </div>

            <div className="panel" style={{ maxWidth: '600px', width: '100%' }}>
                <div className="panel-title" style={{ fontSize: '14px', textAlign: 'center', marginBottom: '10px' }}>
                    🏆 Global Leaderboard 🏆
                </div>

                <div id="lb-wrap">
                    {loading ? <div className="lb-loading">Loading scores...</div> : 
                     leaderboard.length === 0 ? <div className="lb-loading">No scores yet. Be the first!</div> :
                     leaderboard.map((e, i) => {
                         const isYou = currentUser && e.uid === currentUser.uid;
                         const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
                         const rankDisp = i < 3 ? medals[i] : (i + 1);
                         return (
                             <div key={e.uid || i} className="lb-entry" style={{ padding: '12px 0' }}>
                                 <div className={`lb-rank ${rankClass}`} style={{ fontSize: '14px', minWidth: '30px' }}>{rankDisp}</div>
                                 <div className="lb-avatar" style={{ width: '40px', height: '40px', fontSize: '16px' }}>
                                     {e.photoURL ? <img src={e.photoURL} alt="" /> : <span>{(e.name || '?')[0].toUpperCase()}</span>}
                                 </div>
                                 <div className={`lb-name ${isYou ? 'lb-you' : ''}`} style={{ fontSize: '15px' }}>
                                     {e.name || 'Player'}{isYou ? ' ★' : ''}
                                 </div>
                                 <div className="lb-score" style={{ fontSize: '16px' }}>{e.bestScore || 0}</div>
                             </div>
                         );
                     })
                    }
                </div>
            </div>
        </div>
    );
}
