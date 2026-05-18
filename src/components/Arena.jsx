'use client';
import { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { THEMES } from './ThemeStrip';
import { useAuth } from '@/context/AuthContext';
import { doc, updateDoc, collection, addDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP);
}

export function triggerToast(msg) {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('show-toast', { detail: msg }));
    }
}

export default function Arena({ 
    theme, 
    setGameState 
}) {
    const { currentUser, userProfile, setUserProfile, bestScore, setBestScore } = useAuth();
    
    // Core state
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [multiplier, setMultiplier] = useState(1);
    const [lives, setLives] = useState(3);
    const [hits, setHits] = useState(0);
    const [misses, setMisses] = useState(0);
    const [timeLeft, setTimeLeft] = useState(60);
    
    const [gameRunning, setGameRunning] = useState(false);
    const [paused, setPaused] = useState(false);
    
    // Target state
    const [targetIcon, setTargetIcon] = useState(THEMES[theme].items[0]);
    const [targetClass, setTargetClass] = useState('');
    const [specialActive, setSpecialActive] = useState(false);
    const [dangerActive, setDangerActive] = useState(false);
    
    // Refs for animations
    const arenaRef = useRef();
    const targetRef = useRef();
    const timerRef = useRef();
    const moveTimeoutRef = useRef();
    const currentTweenRef = useRef();
    const sessionHitTimestamps = useRef([]);
    const sessionStartTime = useRef(0);

    // Overlay state
    const [overlayState, setOverlayState] = useState({
        show: true,
        reason: 'init', // init, time-up, no-lives
        finalScore: 0,
        finalHits: 0,
        finalAcc: 0,
        finalXp: 0,
        isNewBest: false
    });

    const getDiff = useCallback((time) => {
        const el = 60 - time;
        let baseDiff = { label: 'Easy', speed: 0.72, pause: 1300, seg: 1 };
        
        if (el >= 44) baseDiff = { label: 'Extreme', speed: 0.18, pause: 420, seg: 4 };
        else if (el >= 28) baseDiff = { label: 'Hard', speed: 0.30, pause: 650, seg: 3 };
        else if (el >= 12) baseDiff = { label: 'Normal', speed: 0.48, pause: 950, seg: 2 };

        const tier = userProfile?.progression?.rankTier || 'bronze';
        let mult = 1.0;
        if (tier === 'silver') mult = 0.90;
        if (tier === 'gold') mult = 0.75;
        if (tier === 'diamond') mult = 0.60;

        return {
            label: baseDiff.label,
            speed: baseDiff.speed * mult,
            pause: baseDiff.pause * mult,
            seg: baseDiff.seg
        };
    }, [userProfile?.progression?.rankTier]);

    // Sync game state to parent for RightPanel HUD
    useEffect(() => {
        setGameState({
            score, streak, multiplier, lives, hits, misses, 
            diff: getDiff(timeLeft), gameRunning
        });
    }, [score, streak, multiplier, lives, hits, misses, timeLeft, gameRunning, getDiff, setGameState]);

    // Theme change updates default icon
    useEffect(() => {
        if (!gameRunning) {
            setTargetIcon(THEMES[theme].items[0]);
        }
    }, [theme, gameRunning]);

    const pickTarget = useCallback(() => {
        const th = THEMES[theme];
        const roll = Math.random();
        setDangerActive(false); 
        setSpecialActive(false);
        
        if (roll < 0.10) {
            setTargetIcon(th.special);
            setTargetClass('special');
            setSpecialActive(true);
        } else if (roll < 0.18) {
            setTargetIcon(th.danger);
            setTargetClass('danger-target');
            setDangerActive(true);
        } else {
            setTargetIcon(th.items[Math.floor(Math.random() * th.items.length)]);
            setTargetClass('');
        }
    }, [theme]);

    const scheduleMove = useCallback(() => {
        if (!gameRunning || paused) return;
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        moveTimeoutRef.current = setTimeout(() => { 
            if (gameRunning && !paused) moveTarget(); 
        }, getDiff(timeLeft).pause);
    }, [gameRunning, paused, timeLeft, getDiff]);

    const moveTarget = useCallback(() => {
        if (!gameRunning || paused || !arenaRef.current || !targetRef.current) return;
        
        const maxX = arenaRef.current.offsetWidth - 60;
        const maxY = arenaRef.current.offsetHeight - 60;
        const x = Math.floor(Math.random() * maxX);
        const y = Math.floor(Math.random() * maxY);
        const d = getDiff(timeLeft);
        const spin = Math.random() < 0.35 ? (Math.random() < 0.5 ? 360 : -360) : 0;
        
        if (currentTweenRef.current) currentTweenRef.current.kill();
        
        currentTweenRef.current = gsap.to(targetRef.current, {
            x, y, duration: d.speed, ease: 'power3.out', rotation: '+=' + spin,
            onComplete: () => {
                if (!gameRunning || paused) return;
                gsap.to(targetRef.current, { scale: 1.1, duration: 0.08, yoyo: true, repeat: 1 });
                pickTarget(); 
                scheduleMove();
            }
        });
    }, [gameRunning, paused, timeLeft, getDiff, pickTarget, scheduleMove]);

    const showPop = (e, text, cls) => {
        if (!arenaRef.current) return;
        const aRect = arenaRef.current.getBoundingClientRect();
        const x = (e.clientX - aRect.left) || 120;
        const y = (e.clientY - aRect.top) || 80;
        const el = document.createElement('div');
        el.className = 'score-pop ' + (cls || '');
        el.style.left = x + 'px'; el.style.top = y + 'px';
        el.textContent = text; 
        arenaRef.current.appendChild(el);
        gsap.fromTo(el, { opacity: 1, y: 0, scale: 1 }, { opacity: 0, y: -55, scale: 1.5, duration: 0.75, ease: 'power2.out', onComplete: () => el.remove() });
    };

    const flashMiss = () => {
        if (!arenaRef.current) return;
        const fl = document.createElement('div'); 
        fl.className = 'miss-flash'; 
        arenaRef.current.appendChild(fl);
        setTimeout(() => { if (fl && fl.parentNode) fl.remove(); }, 350);
    };

    const handleHit = (e) => {
        e.stopPropagation();
        if (!gameRunning || paused) return;

        if (dangerActive) {
            setLives(l => l - 1);
            setStreak(0);
            setMultiplier(1);
            showPop(e, '-LIFE', 'danger');
            flashMiss();
            gsap.to(targetRef.current, { x: '+=0', keyframes: [{ x: '-=10' }, { x: '+=20' }, { x: '-=20' }, { x: '+=10' }], duration: 0.08, repeat: 1 });
            
            if (lives - 1 <= 0) { 
                endGame('no-lives'); 
                return; 
            }
            
            if (currentTweenRef.current) currentTweenRef.current.kill();
            if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
            gsap.set(targetRef.current, { x: -200, y: -200 }); 
            pickTarget();
            gsap.to(targetRef.current, { scale: 1, duration: 0.2, ease: 'back.out(2)', onComplete: () => moveTarget() });
            return;
        }

        const now = Date.now();
        sessionHitTimestamps.current.push(now);
        sessionHitTimestamps.current = sessionHitTimestamps.current.filter(t => now - t < 1000);
        if (sessionHitTimestamps.current.length > 5) { triggerToast('⚠ Slow down!'); return; }

        const newHits = hits + 1;
        const newStreak = streak + 1;
        const newMult = newStreak >= 8 ? 4 : newStreak >= 5 ? 3 : newStreak >= 3 ? 2 : 1;
        const pts = (specialActive ? 3 : 1) * newMult;
        const newScore = score + pts;

        setHits(newHits);
        setStreak(newStreak);
        setMultiplier(newMult);
        setScore(newScore);

        showPop(e, '+' + pts, specialActive ? 'special' : '');

        if (currentTweenRef.current) currentTweenRef.current.kill();
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);

        gsap.timeline()
            .to(targetRef.current, { scale: 1.5, duration: 0.07, ease: 'power2.out' })
            .to(targetRef.current, { scale: 0, duration: 0.13, ease: 'back.in(2)' })
            .call(() => {
                gsap.set(targetRef.current, { x: -200, y: -200 }); 
                pickTarget();
                gsap.to(targetRef.current, { scale: 1, duration: 0.22, ease: 'back.out(3)', onComplete: () => moveTarget() });
            });
    };

    const handleArenaMiss = (e) => {
        if (e.target !== arenaRef.current) return;
        if (!gameRunning || paused) return;
        
        const newMisses = misses + 1;
        const newLives = lives - 1;
        
        setMisses(newMisses);
        setStreak(0);
        setMultiplier(1);
        setLives(newLives);
        
        flashMiss();
        gsap.to(targetRef.current, { keyframes: [{ x: '-=10' }, { x: '+=20' }, { x: '-=20' }, { x: '+=10' }], duration: 0.08, repeat: 1 });
        
        if (newLives <= 0) endGame('no-lives');
    };

    const saveGameResult = async (sessionData) => {
        if (!currentUser) return;

        const maxTheoreticalScore = sessionData.durationSec * 4 * 4;
        if (sessionData.score > maxTheoreticalScore || sessionData.hits > sessionData.durationSec * 4) {
            triggerToast('⚠ Score anomaly detected — not saved');
            return;
        }

        try {
            await addDoc(collection(db, 'games'), {
                uid: currentUser.uid,
                ...sessionData,
                createdAt: new Date()
            });

            const xpEarned = sessionData.score * 2 + sessionData.hits * 5;
            const currentXp = userProfile.progression?.xp || 0;
            const newXP = currentXp + xpEarned;
            const newLevel = Math.max(1, Math.floor(newXP / 500) + 1);
            const rankTier = newXP >= 7000 ? 'diamond' : newXP >= 3000 ? 'gold' : newXP >= 1000 ? 'silver' : 'bronze';
            
            const totalHits = (userProfile.stats?.totalHits || 0) + sessionData.hits;
            const totalMisses = (userProfile.stats?.totalMisses || 0) + sessionData.misses;
            const accuracy = totalHits + totalMisses > 0 ? Math.round((totalHits / (totalHits + totalMisses)) * 100) : 0;
            const newBest = Math.max(userProfile.stats?.bestScore || 0, sessionData.score);

            const ref = doc(db, 'users', currentUser.uid);
            await updateDoc(ref, {
                'stats.bestScore': newBest,
                'stats.totalScore': increment(sessionData.score),
                'stats.totalGames': increment(1),
                'stats.totalHits': increment(sessionData.hits),
                'stats.totalMisses': increment(sessionData.misses),
                'stats.accuracy': accuracy,
                'progression.xp': newXP,
                'progression.level': newLevel,
                'progression.rankTier': rankTier
            });

            if (sessionData.score > (userProfile.stats?.bestScore || 0)) {
                const lbRef = doc(db, 'leaderboard', currentUser.uid);
                await setDoc(lbRef, {
                    uid: currentUser.uid,
                    name: userProfile.profile?.name || 'Player',
                    photoURL: userProfile.profile?.photoURL || '',
                    bestScore: sessionData.score,
                    level: newLevel,
                    updatedAt: new Date()
                }, { merge: true });
            }

            setUserProfile(prev => ({
                ...prev,
                stats: { ...prev.stats, bestScore: newBest, totalGames: (prev.stats?.totalGames || 0) + 1, totalHits, totalMisses, accuracy },
                progression: { xp: newXP, level: newLevel, rankTier }
            }));
            setBestScore(newBest);

            window.dispatchEvent(new Event('refresh-leaderboard'));
            triggerToast('✓ Score saved! +' + xpEarned + ' XP');
        } catch (err) {
            console.error('Save error:', err);
            triggerToast('⚠ Could not save score');
        }
    };

    // State refs for endGame
    const stateRef = useRef();
    useEffect(() => {
        stateRef.current = { score, hits, misses, multiplier, timeLeft };
    }, [score, hits, misses, multiplier, timeLeft]);

    const endGame = useCallback(async (reason) => {
        setGameRunning(false);
        setPaused(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
        if (currentTweenRef.current) currentTweenRef.current.kill();
        
        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(err => console.log(err));
        }

        const st = stateRef.current;
        const duration = Math.round((Date.now() - sessionStartTime.current) / 1000);
        const isNewBest = st.score > bestScore;
        if (isNewBest) setBestScore(st.score);

        gsap.to(targetRef.current, { scale: 0, rotation: '+=180', duration: 0.4, ease: 'back.in(2)' });

        const acc = (st.hits + st.misses) > 0 ? Math.round((st.hits / (st.hits + st.misses)) * 100) : 0;
        const xpEarned = st.score * 2 + st.hits * 5;

        setOverlayState({
            show: true,
            reason,
            finalScore: st.score,
            finalHits: st.hits,
            finalAcc: acc,
            finalXp: xpEarned,
            isNewBest
        });

        if (st.score > 0) {
            await saveGameResult({
                score: st.score, hits: st.hits, misses: st.misses,
                multiplierMax: st.multiplier,
                durationSec: duration,
                difficultyPeak: getDiff(st.timeLeft).label,
                accuracy: acc,
            });
        }
    }, [bestScore, getDiff]); // intentionally avoiding recreating

    const startGame = () => {
        setScore(0); setStreak(0); setMultiplier(1); setLives(3); setHits(0); setMisses(0);
        setTimeLeft(60); setGameRunning(true); setPaused(false);
        setSpecialActive(false); setDangerActive(false);
        sessionStartTime.current = Date.now();
        sessionHitTimestamps.current = [];
        
        setOverlayState(prev => ({ ...prev, show: false }));

        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => console.log(err));
        }

        if (timerRef.current) clearInterval(timerRef.current);
        if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);

        const a = arenaRef.current;
        gsap.set(targetRef.current, { scale: 0, rotation: 0, x: a.offsetWidth / 2 - 28, y: a.offsetHeight / 2 - 28 });
        pickTarget();
        gsap.to(targetRef.current, { scale: 1, duration: 0.4, ease: 'back.out(2.5)' });

        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    endGame('time-up');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        scheduleMove();
    };

    const togglePause = () => {
        if (!gameRunning) return;
        setPaused(p => !p);
    };

    useEffect(() => {
        if (paused) { 
            if (currentTweenRef.current) currentTweenRef.current.pause(); 
            if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current); 
        } else if (gameRunning) { 
            if (currentTweenRef.current) currentTweenRef.current.resume(); 
            scheduleMove(); 
        }
    }, [paused, gameRunning, scheduleMove]);

    useEffect(() => {
        // init
        if (targetRef.current && arenaRef.current && !gameRunning) {
            gsap.set(targetRef.current, { x: 260, y: 200 });
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (moveTimeoutRef.current) clearTimeout(moveTimeoutRef.current);
            if (currentTweenRef.current) currentTweenRef.current.kill();
        }
    }, []);

    const pct = (timeLeft / 60) * 100;
    const timerBg = pct < 25 ? 'var(--pink)' : pct < 50 ? 'var(--gold)' : 'var(--cyan)';

    return (
        <div className="arena-col">
            <div id="arena-hud">
                <div className="hud-pill">
                    <span className="hud-pill-label">Score</span>
                    <span className="hud-pill-val l">{score}</span>
                </div>
                <div className="hud-pill">
                    <span className="hud-pill-label">Time</span>
                    <span className="hud-pill-val c">{timeLeft}</span>
                </div>
                <div className="hud-pill">
                    <span className="hud-pill-label">Best</span>
                    <span className="hud-pill-val">{Math.max(bestScore, score)}</span>
                </div>
            </div>

            <div className="timer-wrap">
                <div className="timer-fill" style={{ width: `${pct}%`, background: timerBg }}></div>
            </div>

            <div id="arena" ref={arenaRef} onClick={handleArenaMiss}>


                <div id="target" ref={targetRef} className={targetClass} onClick={handleHit}>
                    {targetIcon}
                </div>

                <div id="overlay" className={overlayState.show ? '' : 'hidden'}>
                    <div className="ov-icon">
                        {overlayState.reason === 'init' ? '🎯' : overlayState.reason === 'time-up' ? '⏰' : '💀'}
                    </div>
                    <div id="ov-title">
                        {overlayState.reason === 'init' ? 'READY TO PLAY?' : overlayState.reason === 'time-up' ? 'TIME\'S UP!' : 'NO LIVES LEFT!'}
                    </div>
                    {overlayState.reason !== 'init' && <div id="ov-score" style={{ display: 'block' }}>{overlayState.finalScore}</div>}
                    {overlayState.isNewBest && overlayState.finalScore > 0 && <div id="ov-best-tag" style={{ display: 'block' }}>🏆 NEW BEST!</div>}
                    <div id="ov-msg">
                        {overlayState.reason === 'init' ? 
                         "Click the moving icon before it escapes. Miss 3× and it's over. Hit streaks unlock multipliers!" :
                         overlayState.reason === 'time-up' ? (overlayState.finalScore > 30 ? 'Outstanding reflexes!' : 'Keep grinding!') : 'You ran out of lives.'}
                    </div>
                    
                    {overlayState.reason !== 'init' && (
                        <div className="ov-stats-row" style={{ display: 'flex' }}>
                            <div className="ov-stat">
                                <div className="ov-stat-val">{overlayState.finalHits}</div>
                                <div className="ov-stat-label">HITS</div>
                            </div>
                            <div className="ov-stat">
                                <div className="ov-stat-val">{overlayState.finalAcc}%</div>
                                <div className="ov-stat-label">ACCURACY</div>
                            </div>
                            <div className="ov-stat">
                                <div className="ov-stat-val">+{overlayState.finalXp}</div>
                                <div className="ov-stat-label">XP EARNED</div>
                            </div>
                        </div>
                    )}
                    
                    <button className="btn-ov" onClick={startGame}>
                        {overlayState.reason === 'init' ? '▶ START GAME' : '↺ PLAY AGAIN'}
                    </button>
                </div>
            </div>

            <div className="arena-bottom">
                <span className="arena-meta">Difficulty: <b>{getDiff(timeLeft).label}</b></span>
                <span id="special-hint" className={specialActive || dangerActive ? 'on' : ''}>
                    {specialActive ? '⭐ Special — 3× pts!' : dangerActive ? '💀 DANGER — costs a life!' : ''}
                </span>
                <span className="arena-meta">Streak: <b>{streak}</b></span>
            </div>

            <div className="ctrl-row">
                {!gameRunning && <button className="ctrl-btn primary" onClick={startGame}>▶ START</button>}
                {gameRunning && <button className="ctrl-btn warn" onClick={togglePause}>{paused ? '▶ RESUME' : '⏸ PAUSE'}</button>}
            </div>
        </div>
    );
}
