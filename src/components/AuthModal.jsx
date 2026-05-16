'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
    const { currentUser, loginGoogle, loginAnon, loginEmail } = useAuth();
    const [emailFormVisible, setEmailFormVisible] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (currentUser) return null;

    const handleEmailAuth = async () => {
        if (!email || password.length < 6) {
            setError('Enter valid email and password (6+ chars)');
            return;
        }
        try {
            await loginEmail(email, password);
        } catch (err) {
            setError(err.message.replace('Firebase: ', ''));
        }
    };

    const handleGoogleAuth = async () => {
        try { await loginGoogle(); } catch (e) { setError(e.message); }
    };

    const handleAnonAuth = async () => {
        try { await loginAnon(); } catch (e) { setError(e.message.replace('Firebase: ', '')); }
    };

    return (
        <div id="auth-modal">
            <div className="auth-box">
                <div className="auth-logo">⚡ CATCH GAME</div>
                <h2>LOGIN TO PLAY</h2>
                <p>Sign in to save your scores, climb the leaderboard, and track your progression.</p>
                {error && <div className="auth-error" style={{ display: 'block' }}>{error}</div>}

                <button className="btn-google" onClick={handleGoogleAuth}>
                    <svg width="18" height="18" viewBox="0 0 18 18">
                        <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" />
                        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
                    </svg>
                    Continue with Google
                </button>

                <div className="auth-divider"><span>OR</span></div>

                {emailFormVisible && (
                    <div className="email-form" style={{ display: 'flex' }}>
                        <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} />
                        <input className="auth-input" type="password" placeholder="Password (min 6 chars)" value={password} onChange={e => setPassword(e.target.value)} />
                        <button className="btn-email" onClick={handleEmailAuth}>Sign In / Register</button>
                    </div>
                )}
                
                <div className="toggle-form" onClick={() => setEmailFormVisible(!emailFormVisible)}>
                    Use email instead → <span>{emailFormVisible ? 'Hide form' : 'Show form'}</span>
                </div>

                <div className="auth-divider"><span>OR</span></div>
                <button className="btn-anon" onClick={handleAnonAuth}>👻 Play as Guest (limited)</button>
            </div>
        </div>
    );
}
