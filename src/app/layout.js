import { Orbitron, Rajdhani } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

const orbitron = Orbitron({ subsets: ['latin'], variable: '--font' });
const rajdhani = Rajdhani({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--body' });

export const metadata = {
  title: 'Catch Game — Arcade',
  description: 'Cyberpunk style arcade catch game built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${orbitron.variable} ${rajdhani.variable}`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
