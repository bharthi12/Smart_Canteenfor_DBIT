import React from 'react';
import { useCart } from '../context/CartContext';
import { Plus, Minus, Trash2 } from 'lucide-react';

export function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const subtotal = (item.price * item.quantity).toFixed(2);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 0',
        borderBottom: '1px solid var(--color-border)',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '220px' }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              objectFit: 'cover',
            }}
          />
        )}
        <div>
          <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 800, color: 'var(--color-ink)' }}>
            {item.name}
          </h4>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
            ₹{Number(item.price).toFixed(2)} each
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="qty-selector">
          <button
            onClick={() => updateQuantity(item.dishId, item.quantity - 1)}
            className="qty-btn"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="qty-display">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.dishId, item.quantity + 1)}
            className="qty-btn"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>

        <div style={{ width: '80px', textAlign: 'right', fontWeight: 800, color: 'var(--color-forest-deep)' }}>
          ₹{subtotal}
        </div>

        <button
          onClick={() => removeFromCart(item.dishId)}
          className="btn btn-outline btn-sm"
          style={{ padding: '8px', color: 'var(--color-danger)', borderColor: 'var(--color-border)' }}
          title="Remove item"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
