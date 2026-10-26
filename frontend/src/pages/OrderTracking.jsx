import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { socketService } from '../services/socketService';
import { OrderProgress } from '../components/OrderProgress';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { LoadingSpinner } from '../components/LoadingState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Clock, ArrowLeft, RefreshCw, AlertCircle, Ban, WifiOff, Banknote } from 'lucide-react';

export function OrderTracking() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [wsConnected, setWsConnected] = useState(true);

  useEffect(() => {
    fetchOrder();

    // Reconnection listener
    const unsubStatus = socketService.onStatusChange(status => {
      setWsConnected(status);
      if (status) {
        fetchOrder();
      }
    });

    // Subscribe to STOMP topic for this order: /topic/orders/{orderId}
    const unsubOrderEvents = socketService.subscribe(`/topic/orders/${id}`, (event) => {
      if (event.orderId === Number(id)) {
        setOrder(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: event.status || prev.status,
            paymentStatus: event.paymentStatus || prev.paymentStatus,
            updatedAt: event.updatedAt || prev.updatedAt,
          };
        });
      }
    });

    return () => {
      unsubStatus();
      unsubOrderEvents();
    };
  }, [id]);

  async function fetchOrder() {
    try {
      setError('');
      const data = await orderService.getOrderById(id);
      setOrder(data);
    } catch (err) {
      setError(err.message || 'Could not load order details.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmCancel() {
    setCancelling(true);
    setConfirmCancelOpen(false);
    try {
      const updated = await orderService.cancelOrder(id);
      setOrder(updated);
    } catch (err) {
      setError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return <LoadingSpinner text="Loading live order status..." />;
  }

  if (error || !order) {
    return (
      <div className="container main-content" style={{ paddingTop: '48px', maxWidth: '600px' }}>
        <div className="alert alert-danger" style={{ textAlign: 'center', padding: '32px' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: 'var(--text-lg)', marginBottom: '8px' }}>Unable to load order</h2>
          <p style={{ color: 'var(--color-ink)', marginBottom: '20px' }}>{error || 'Order not found.'}</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/orders" className="btn btn-outline btn-sm">
              <ArrowLeft size={16} /> Back to My Orders
            </Link>
            <button onClick={fetchOrder} className="btn btn-primary btn-sm">
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = order.status === 'PLACED' || order.status === 'ACCEPTED';

  return (
    <div className="container main-content" style={{ paddingTop: '36px', maxWidth: '820px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--color-forest)',
            fontWeight: 700,
            fontSize: 'var(--text-sm)',
          }}
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
      </div>

      {!wsConnected && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={18} />
            <span>Reconnecting to live tracker...</span>
          </div>
          <button onClick={fetchOrder} className="btn btn-outline btn-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      )}

      {/* Prominent Token Display */}
      <div className="token-callout">
        <div className="token-label">Your Order Token</div>
        <div className="token-value">{order.tokenNumber}</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-cream)', marginTop: '8px' }}>
          Please show this token at the counter to collect your meal.
        </div>
      </div>

      {/* Main Order Card */}
      <div
        style={{
          backgroundColor: 'var(--color-white)',
          borderRadius: 'var(--radius-card)',
          padding: '32px',
          boxShadow: 'var(--shadow-card)',
          border: '1px solid var(--color-border)',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '20px',
            marginBottom: '28px',
          }}
        >
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>Live Preparation Tracker</h2>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
              Placed at: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge paymentStatus={order.paymentStatus} />
          </div>
        </div>

        {/* Step Progression Tracker */}
        <OrderProgress status={order.status} />

        {/* Items Ordered Table */}
        <div style={{ marginTop: '36px' }}>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 800, marginBottom: '16px' }}>
            Items Summary
          </h3>
          <div style={{ borderTop: '1px solid var(--color-border)' }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--color-border)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <div>
                  <strong style={{ color: 'var(--color-ink)' }}>{item.dishName}</strong>
                  <span style={{ color: 'var(--color-muted)', marginLeft: '8px' }}>
                    × {item.quantity}
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-forest-deep)' }}>
                  ₹{Number(item.subtotal).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              paddingTop: '20px',
            }}
          >
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 800 }}>Total Amount</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-forest-deep)' }}>
              ₹{Number(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment instructions */}
        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-cream-light)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <Banknote size={22} color="var(--color-forest)" />
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', lineHeight: 1.4 }}>
            <strong>Payment Mode:</strong> Cash at counter ({order.paymentStatus}). When picking up token{' '}
            <strong>{order.tokenNumber}</strong>, hand over cash to the canteen cashier.
          </div>
        </div>

        {/* Cancellation button if eligible */}
        {canCancel && (
          <div
            style={{
              marginTop: '32px',
              paddingTop: '24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>
              Orders can only be cancelled while status is <strong>Placed</strong> or <strong>Accepted</strong>.
            </span>
            <button
              onClick={() => setConfirmCancelOpen(true)}
              disabled={cancelling}
              className="btn btn-outline btn-sm"
              style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              <Ban size={16} />
              <span>{cancelling ? 'Cancelling...' : 'Cancel Order'}</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmCancelOpen}
        title="Cancel Order?"
        message={`Are you sure you want to cancel order token ${order.tokenNumber}? This action cannot be reversed.`}
        confirmText="Yes, Cancel Order"
        cancelText="No, Keep Order"
        isDangerous={true}
        onConfirm={handleConfirmCancel}
        onCancel={() => setConfirmCancelOpen(false)}
      />
    </div>
  );
}
