import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleDashboard = () => {
    window.location.href = '/dashboard';
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 24,
          padding: '48px 40px',
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'rgba(239,68,68,0.15)',
            border: '2px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h1 style={{ color: 'white', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
            Something went wrong
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
            An unexpected error occurred. Don't worry — your data is safe.
          </p>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 32 }}>
            Try refreshing the page or navigate back to the dashboard.
          </p>

          {/* Dev-only error detail */}
          {isDev && this.state.error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 28,
              textAlign: 'left',
            }}>
              <p style={{ color: '#fca5a5', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all', margin: 0 }}>
                {this.state.error.toString()}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRefresh}
              style={{
                padding: '11px 24px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white',
                border: 'none',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
              Refresh Page
            </button>
            <button
              onClick={this.handleDashboard}
              style={{
                padding: '11px 24px',
                background: 'rgba(255,255,255,0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
}
