import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0e0e0f', color: '#f0f0f1', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32, fontFamily: 'sans-serif' }}>
          <span style={{ fontSize: 48 }}>⚠️</span>
          <h2 style={{ margin: 0, fontSize: 20 }}>Something went wrong</h2>
          <pre style={{ background: '#171719', padding: 16, borderRadius: 12, maxWidth: 600, width: '100%', overflowX: 'auto', color: '#F2B8B5', fontSize: 13 }}>{this.state.error}</pre>
          <button onClick={() => window.location.href = '/'} style={{ background: '#A8C7FA', color: '#0e0e0f', border: 'none', borderRadius: 999, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>Reload</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Analytics />
  </React.StrictMode>
);
