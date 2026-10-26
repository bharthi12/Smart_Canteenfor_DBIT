import React from 'react';
import { Utensils, ShoppingBag, Clock } from 'lucide-react';

export function EmptyState({ title, description, actionText, onAction, iconType = 'food' }) {
  const IconComponent = iconType === 'cart' ? ShoppingBag : iconType === 'clock' ? Clock : Utensils;

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '64px 24px',
        backgroundColor: 'var(--color-white)',
        borderRadius: 'var(--radius-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-card)',
        maxWidth: '540px',
        margin: '32px auto',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--color-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--color-forest)',
        }}
      >
        <IconComponent size={34} />
      </div>
      <h3 style={{ fontSize: 'var(--heading-sm)', fontWeight: 800, color: 'var(--color-ink)', marginBottom: '8px' }}>
        {title}
      </h3>
      <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-base)', marginBottom: '24px', lineHeight: 1.5 }}>
        {description}
      </p>
      {actionText && onAction && (
        <button onClick={onAction} className="btn btn-primary">
          {actionText}
        </button>
      )}
    </div>
  );
}
