'use client';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function TopBar({ onOpenDashboard }) {
    const { currentUser, userProfile, logout } = useAuth();

    if (!currentUser || !userProfile) {
        return (
            <div id="top-bar">
                <div className="logo">⚡ CATCH <div className="logo-tag">ARCADE</div></div>
            </div>
        );
    }

    const name = userProfile.profile?.name || 'Player';
    const photo = userProfile.profile?.photoURL;
    const tier = userProfile.progression?.rankTier || 'bronze';

    return (
        <div id="top-bar">
            <div className="logo">⚡ CATCH <div className="logo-tag">ARCADE</div></div>
            <div id="user-chip" style={{ display: 'flex', alignItems: 'center' }}>
                <div className="avatar" style={{ cursor: 'pointer' }} onClick={onOpenDashboard}>
                    {photo ? <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} alt="" /> : name[0].toUpperCase()}
                </div>
                <div style={{ cursor: 'pointer' }} onClick={onOpenDashboard}>
                    <div className="user-name">{name}</div>
                    <div className={`user-rank rank-${tier}`}>{tier.toUpperCase()}</div>
                </div>
                <button className="btn-sm" onClick={onOpenDashboard} style={{ marginLeft: '8px' }}>Dashboard</button>
                <Link href="/leaderboard" className="btn-sm" style={{ marginLeft: '6px', textDecoration: 'none' }}>Leaderboard</Link>
                <button className="btn-sm" onClick={logout} style={{ marginLeft: '6px' }}>Sign out</button>
            </div>
        </div>
    );
}
