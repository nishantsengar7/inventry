import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>

      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${80 + i * 60}px`,
          height: `${80 + i * 60}px`,
          borderRadius: '50%',
          border: `1px solid rgba(99,102,241,${0.05 + i * 0.02})`,
          left: `${10 + i * 18}%`,
          top: `${20 + (i % 2) * 40}%`,
          animation: `orbit ${6 + i * 2}s linear infinite`,
          animationDirection: i % 2 === 0 ? 'normal' : 'reverse',
        }} />
      ))}

      <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>

        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div style={{
            fontSize: 'clamp(100px, 20vw, 180px)',
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-8px',
            userSelect: 'none',
            animation: 'float-404 3s ease-in-out infinite',
          }}>
            404
          </div>
          <div style={{
            position: 'absolute',
            bottom: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '60%',
            height: 20,
            background: 'rgba(99,102,241,0.3)',
            borderRadius: '50%',
            filter: 'blur(10px)',
            animation: 'shadow-pulse 3s ease-in-out infinite',
          }} />
        </div>

        <div style={{ margin: '0 auto 28px', width: 80, height: 100, position: 'relative' }}>
          <div style={{
            width: 44, height: 56,
            background: 'linear-gradient(180deg, #6366f1, #4f46e5)',
            borderRadius: '50% 50% 40% 40% / 60% 60% 40% 40%',
            margin: '0 auto',
            position: 'relative',
            animation: 'astronaut-float 2.5s ease-in-out infinite',
          }}>
            <div style={{
              width: 40, height: 40,
              background: 'linear-gradient(135deg, #c7d2fe, #a5b4fc)',
              borderRadius: '50%',
              position: 'absolute',
              top: -20, left: 2,
              border: '3px solid #6366f1',
            }}>
              <div style={{
                width: 22, height: 16,
                background: 'rgba(99,102,241,0.6)',
                borderRadius: 8,
                position: 'absolute',
                top: 10, left: 6,
              }} />
            </div>
            <div style={{
              width: 12, height: 30,
              background: '#6366f1',
              borderRadius: 8,
              position: 'absolute',
              top: 10, left: -10,
              transform: 'rotate(-20deg)',
            }} />
            <div style={{
              width: 12, height: 30,
              background: '#6366f1',
              borderRadius: 8,
              position: 'absolute',
              top: 10, right: -10,
              transform: 'rotate(20deg)',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 4 }}>
            <div style={{
              width: 14, height: 28,
              background: '#4f46e5',
              borderRadius: 8,
              animation: 'astronaut-float 2.5s ease-in-out infinite',
            }} />
            <div style={{
              width: 14, height: 28,
              background: '#4f46e5',
              borderRadius: 8,
              animation: 'astronaut-float 2.5s ease-in-out 0.2s infinite',
            }} />
          </div>
        </div>

        <h1 style={{
          color: 'white',
          fontSize: 28,
          fontWeight: 700,
          marginBottom: 10,
        }}>
          Page Not Found
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: 15,
          maxWidth: 360,
          margin: '0 auto 36px',
          lineHeight: 1.6,
        }}>
          Looks like you've drifted into deep space. The page you're looking for doesn't exist.
        </p>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 12px 32px rgba(99,102,241,0.45)'; }}
            onMouseLeave={(e) => { e.target.style.transform = ''; e.target.style.boxShadow = '0 8px 24px rgba(99,102,241,0.35)'; }}
          >
            🏠 Go to Dashboard
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 28px',
              background: 'rgba(255,255,255,0.07)',
              color: '#cbd5e1',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.target.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={(e) => { e.target.style.background = 'rgba(255,255,255,0.07)'; }}
          >
            ← Go Back
          </button>
        </div>
      </div>

      <style>{`
        @import url('https:
        @keyframes float-404 {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes shadow-pulse {
          0%, 100% { opacity: 0.6; transform: translateX(-50%) scaleX(1); }
          50%       { opacity: 0.2; transform: translateX(-50%) scaleX(0.7); }
        }
        @keyframes astronaut-float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(3deg); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
