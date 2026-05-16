'use client';
import { useEffect, useState } from 'react';

export default function Toast() {
    const [msg, setMsg] = useState('');
    const [show, setShow] = useState(false);

    useEffect(() => {
        const handleToast = (e) => {
            setMsg(e.detail);
            setShow(true);
            setTimeout(() => setShow(false), 2800);
        };
        window.addEventListener('show-toast', handleToast);
        return () => window.removeEventListener('show-toast', handleToast);
    }, []);

    return (
        <div id="toast" className={show ? 'show' : ''}>
            {msg}
        </div>
    );
}
