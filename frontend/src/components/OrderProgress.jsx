import React from 'react';
import { Check, Clock, CheckCircle2, ChefHat, Sparkles, XCircle } from 'lucide-react';

const STEPS = [
  { key: 'PLACED', label: 'Placed', icon: Clock },
  { key: 'ACCEPTED', label: 'Accepted', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Preparing', icon: ChefHat },
  { key: 'READY', label: 'Ready', icon: Sparkles },
  { key: 'COMPLETED', label: 'Completed', icon: Check },
];

export function OrderProgress({ status }) {
  if (status === 'CANCELLED') {
    return (
      <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <XCircle size={24} />
        <div>
          <strong style={{ display: 'block', fontSize: 'var(--text-base)' }}>Order Cancelled</strong>
          <span>This order was cancelled and will not be prepared.</span>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex(s => s.key === status);
  const fillPercentage = currentIndex >= 0 ? (currentIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="progress-tracker">
      <div className="progress-track-bg" />
      <div
        className="progress-track-fill"
        style={{ width: `calc(${fillPercentage}% - ${fillPercentage === 100 ? 0 : 20}px)` }}
      />

      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isActive = idx === currentIndex;
        const IconComponent = step.icon;

        return (
          <div
            key={step.key}
            className={`progress-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="progress-circle">
              {isCompleted ? <Check size={18} strokeWidth={3} /> : <IconComponent size={18} />}
            </div>
            <span className="progress-label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
