import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { CartItem } from '../components/CartItem';
import { EmptyState } from '../components/EmptyState';
import { Banknote, ShoppingBag, ArrowRight, AlertCircle, CheckCircle, Shield } from 'lucide-react';

export function Cart() {
  const { cartItems, totalAmount, totalCount, clearCart } = useCart();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handlePlaceOrder() {
    if (cartItems.length === 0) return;

    setError('');
    setLoading(true);

    try {
      const order = await orderService.createOrder(cartItems);
      clearCart();
      // Navigate directly to the live tracking page for the newly created order
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err.message || 'Failed to place order. Some items might be sold out.');
    } finally {
      setLoading(false);
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="container main-content" style={{ paddingTop: '48px' }}>
        <EmptyState
          iconType="cart"
          title="Your cart is empty"
          description="Looks like you haven't added any delicious food yet. Check out the menu and pick your favourites!"
          actionText="Browse Menu"
          onAction={() => navigate('/menu')}
        />
      </div>
    );
  }

  return (
    <div className="container main-content" style={{ paddingTop: '36px' }}>
      <h1
        style={{
          fontSize: 'var(--heading-md)',
          color: 'var(--color-forest-deep)',
          fontWeight: 900,
          marginBottom: '24px',
        }}
      >
        Your Order Cart ({totalCount} items)
      </h1>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <div>
            <strong>Order submission notice:</strong> {error}
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Cart items list */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-card)',
            padding: '24px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Selected Dishes</h2>
            <button
              onClick={clearCart}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--color-muted)', borderColor: 'var(--color-border)' }}
            >
              Clear Cart
            </button>
          </div>

          <div>
            {cartItems.map((item) => (
              <CartItem key={item.dishId} item={item} />
            ))}
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <Link
              to="/menu"
              style={{
                color: 'var(--color-forest)',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              + Add more items from menu
            </Link>
          </div>
        </div>

        {/* Right Column: Order Summary & Checkout */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-card)',
            padding: '28px',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
            position: 'sticky',
            top: '90px',
          }}
        >
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '20px' }}>
            Order Summary
          </h2>

          <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--color-muted)' }}>Items Subtotal</span>
              <span style={{ fontWeight: 700 }}>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: 'var(--color-muted)' }}>Packaging &amp; Service Fee</span>
              <span style={{ fontWeight: 700, color: 'var(--color-forest)' }}>FREE</span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Total Payable</span>
            <span
              style={{
                fontSize: '2rem',
                fontWeight: 900,
                color: 'var(--color-forest-deep)',
              }}
            >
              ₹{totalAmount.toFixed(2)}
            </span>
          </div>

          {/* Cash Payment Callout */}
          <div
            style={{
              backgroundColor: 'var(--color-cream-light)',
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: '24px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <Banknote size={24} color="var(--color-forest)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-forest-deep)' }}>
                Payment Method: Cash at Counter
              </strong>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Pay cash when collecting your order at the canteen counter. No online payment or card needed.
              </p>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="btn btn-primary btn-full btn-lg"
          >
            <ShoppingBag size={20} />
            <span>{loading ? 'Submitting Order...' : 'Place Order (Cash at Counter)'}</span>
            <ArrowRight size={18} />
          </button>

          <p
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
              textAlign: 'center',
              marginTop: '16px',
            }}
          >
            You will receive a unique token number to track order preparation live.
          </p>
        </div>
      </div>
    </div>
  );
}
