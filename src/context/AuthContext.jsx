'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signInAnonymously, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, gProvider } from '@/lib/firebase';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [bestScore, setBestScore] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setCurrentUser(user);
                try {
                    await loadOrCreateProfile(user);
                } catch (e) {
                    console.error("Profile error:", e);
                    // Fallback local profile if firestore fails
                    setUserProfile({
                        uid: user.uid,
                        profile: { name: user.isAnonymous ? 'Guest' : 'Player' },
                        stats: {}, progression: { level: 1, xp: 0, rankTier: 'bronze' }
                    });
                }
            } else {
                setCurrentUser(null);
                setUserProfile(null);
                setBestScore(0);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    async function loadOrCreateProfile(user) {
        const ref = doc(db, 'users', user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setBestScore(data.stats?.bestScore || 0);
        } else {
            const isAnon = user.isAnonymous;
            const newProfile = {
                uid: user.uid,
                profile: {
                    name: isAnon ? 'Guest' : (user.displayName || user.email?.split('@')[0] || 'Player'),
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                    provider: isAnon ? 'anonymous' : (user.providerData[0]?.providerId === 'google.com' ? 'google' : 'email'),
                },
                stats: { bestScore: 0, totalScore: 0, totalGames: 0, totalHits: 0, totalMisses: 0, accuracy: 0 },
                progression: { xp: 0, level: 1, rankTier: 'bronze' },
                streak: { best: 0, current: 0, lastPlayed: null }
            };
            setUserProfile(newProfile);
            await setDoc(ref, newProfile);
        }
    }

    const loginGoogle = async () => signInWithPopup(auth, gProvider);
    const loginAnon = async () => signInAnonymously(auth);
    const logout = async () => signOut(auth);

    const loginEmail = async (email, pass) => {
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (err) {
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                await createUserWithEmailAndPassword(auth, email, pass);
            } else {
                throw err;
            }
        }
    };

    return (
        <AuthContext.Provider value={{
            currentUser, userProfile, setUserProfile, bestScore, setBestScore, loading,
            loginGoogle, loginAnon, loginEmail, logout
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
