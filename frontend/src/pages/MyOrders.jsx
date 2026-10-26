import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { LoadingSpinner } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Clock, ArrowRight, RefreshCw, ChevronRight } from 'lucide-react';

export function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'HISTORY'
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setError('');
      const data = await orderService.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  }

  const activeOrders = orders.filter(
    (o) => o.status === 'PLACED' || o.status === 'ACCEPTED' || o.status === 'PREPARING' || o.status === 'READY'
  );

  const historyOrders = orders.filter(
    (o) => o.status === 'COMPLETED' || o.status === 'CANCELLED'
  );

  const displayedOrders = activeTab === 'ACTIVE' ? activeOrders : historyOrders;

  return (
    <div className="container main-content" style={{ paddingTop: '36px', maxWidth: '860px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <h1 style={{ fontSize: 'var(--heading-md)', color: 'var(--color-forest-deep)', fontWeight: 900 }}>
          My Canteen Orders
        </h1>
        <button onClick={fetchOrders} className="btn btn-outline btn-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          borderBottom: '2px solid var(--color-border)',
          marginBottom: '24px',
        }}
      >
        <button
          onClick={() => setActiveTab('ACTIVE')}
          style={{
            padding: '12px 20px',
            fontWeight: 800,
            fontSize: 'var(--text-sm)',
            color: activeTab === 'ACTIVE' ? 'var(--color-tomato)' : 'var(--color-muted)',
            borderBottom: activeTab === 'ACTIVE' ? '3px solid var(--color-tomato)' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Active Orders ({activeOrders.length})
        </button>

        <button
          onClick={() => setActiveTab('HISTORY')}
          style={{
            padding: '12px 20px',
            fontWeight: 800,
            fontSize: 'var(--text-sm)',
            color: activeTab === 'HISTORY' ? 'var(--color-tomato)' : 'var(--color-muted)',
            borderBottom: activeTab === 'HISTORY' ? '3px solid var(--color-tomato)' : '3px solid transparent',
            marginBottom: '-2px',
          }}
        >
          Past Orders ({historyOrders.length})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching your order history..." />
      ) : error ? (
        <div className="alert alert-danger" style={{ textAlign: 'center', padding: '24px' }}>
          <p>{error}</p>
          <button onClick={fetchOrders} className="btn btn-outline btn-sm" style={{ marginTop: '12px' }}>
            Try Again
          </button>
        </div>
      ) : displayedOrders.length === 0 ? (
        <EmptyState
          iconType="clock"
          title={activeTab === 'ACTIVE' ? 'No active orders' : 'No past orders'}
          description={
            activeTab === 'ACTIVE'
              ? 'You do not have any orders being prepared right now.'
              : 'You have not completed or cancelled any canteen orders yet.'
          }
          actionText="Order from Menu"
          onAction={() => navigate('/menu')}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayedOrders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              style={{
                backgroundColor: 'var(--color-white)',
                borderRadius: 'var(--radius-card)',
                padding: '20px 24px',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = 'var(--color-forest)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
                  <span
                    style={{
                      fontSize: 'var(--text-lg)',
                      fontWeight: 900,
                      color: 'var(--color-forest-deep)',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {order.tokenNumber}
                  </span>
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge paymentStatus={order.paymentStatus} />
                </div>

                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
                  Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-ink)', marginTop: '6px' }}>
                  {order.items.map((i) => `${i.dishName} (×${i.quantity})`).join(', ')}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Total Amount</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-forest-deep)' }}>
                    ₹{Number(order.totalAmount).toFixed(2)}
                  </div>
                </div>
                <ChevronRight size={20} color="var(--color-forest)" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
