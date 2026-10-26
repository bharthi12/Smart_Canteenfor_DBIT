import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ text = 'Loading delicious dishes...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 20px',
        color: 'var(--color-forest)',
      }}
    >
      <Loader2 size={40} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ marginTop: '16px', fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-forest-deep)' }}>
        {text}
      </p>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
