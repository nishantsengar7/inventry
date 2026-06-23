import { useEffect, useState } from 'react';

export default function AppLoader({ onComplete }) {
  const [dots, setDots] = useState('');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 400);
    }, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
          boxShadow: '0 0 60px rgba(99,102,241,0.5)',
          animation: 'spin-bounce 1.5s ease-in-out infinite',
        }}
      >
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27,6.96 12,12.01 20.73,6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      </div>

      <h1
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-0.5px',
          marginBottom: 8,
          animation: 'fade-in-up 0.6s ease forwards',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Inven<span style={{ color: '#818cf8' }}>Track</span>
      </h1>

      <p
        style={{
          color: '#94a3b8',
          fontSize: 14,
          marginBottom: 36,
          animation: 'fade-in-up 0.6s ease 0.2s forwards',
          opacity: 0,
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        Loading your inventory{dots}
      </p>

      <div
        style={{
          width: 200,
          height: 3,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)',
            borderRadius: 99,
            animation: 'progress-slide 1.5s ease-in-out forwards',
          }}
        />
      </div>

      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: `rgba(99,102,241,${0.2 + i * 0.1})`,
            left: `${15 + i * 15}%`,
            top: `${20 + (i % 3) * 20}%`,
            animation: `float-particle ${2 + i * 0.4}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@700;800&display=swap');

        @keyframes spin-bounce {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(8deg) scale(1.05); }
          75% { transform: rotate(-8deg) scale(0.95); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progress-slide {
          0%   { width: 0%; }
          60%  { width: 80%; }
          100% { width: 100%; }
        }
        @keyframes float-particle {
          from { transform: translateY(0px) scale(1); opacity: 0.3; }
          to   { transform: translateY(-20px) scale(1.3); opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
