'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import TopBar from '@/components/TopBar';
import ThemeStrip from '@/components/ThemeStrip';
import LeftPanel from '@/components/LeftPanel';
import RightPanel from '@/components/RightPanel';
import Arena from '@/components/Arena';
import Toast from '@/components/Toast';
import DashboardModal from '@/components/DashboardModal';

export default function Home() {
    const { loading } = useAuth();
    const [theme, setTheme] = useState('animals');
    const [gameState, setGameState] = useState({
        score: 0, streak: 0, multiplier: 1, lives: 3, 
        hits: 0, misses: 0, diff: { label: 'Easy', seg: 1 },
        gameRunning: false
    });
    
    const [isOffline, setIsOffline] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);

    useEffect(() => {
        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        setIsOffline(!navigator.onLine);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (loading) {
        return <div className="page" style={{ justifyContent: 'center' }}>Loading...</div>;
    }

    return (
        <>
            <div className="glow-tl"></div>
            <div className="glow-br"></div>

            <AuthModal />
            <Toast />
            <DashboardModal isOpen={isDashboardOpen} onClose={() => setIsDashboardOpen(false)} />

            <div className="page">
                {isOffline && (
                    <div id="offline-banner" style={{ display: 'block' }}>
                        ⚠ You are offline. Scores will not be saved.
                    </div>
                )}

                <TopBar onOpenDashboard={() => setIsDashboardOpen(true)} />
                
                <ThemeStrip 
                    theme={theme} 
                    setTheme={setTheme} 
                    gameRunning={gameState.gameRunning} 
                />

                <div className="main-grid">
                    <LeftPanel />

                    <Arena 
                        theme={theme} 
                        setGameState={setGameState} 
                    />

                    <RightPanel 
                        lives={gameState.lives}
                        combo={gameState.multiplier}
                        score={gameState.score}
                        hits={gameState.hits}
                        misses={gameState.misses}
                        multiplier={gameState.multiplier}
                        diff={gameState.diff}
                        streak={gameState.streak}
                    />
                </div>
            </div>
        </>
    );
}
