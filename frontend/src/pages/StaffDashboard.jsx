import React, { useState, useEffect } from 'react';
import { orderService } from '../services/orderService';
import { menuService } from '../services/menuService';
import { socketService } from '../services/socketService';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/OrderStatus';
import { LoadingSpinner } from '../components/LoadingState';
import {
  ShieldCheck,
  Clock,
  ChefHat,
  Sparkles,
  CheckCircle2,
  DollarSign,
  UtensilsCrossed,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  WifiOff,
  User,
  Plus,
  Pencil,
} from 'lucide-react';

export function StaffDashboard() {
  const [activeTab, setActiveTab] = useState('QUEUE'); // 'QUEUE' or 'MENU'
  const [activeOrders, setActiveOrders] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);
  const [wsConnected, setWsConnected] = useState(true);
  const [dishFormOpen, setDishFormOpen] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [dishForm, setDishForm] = useState({
    name: '',
    description: '',
    price: '',
    imageUrl: '',
    category: 'Breakfast',
    available: true,
  });

  useEffect(() => {
    fetchActiveOrders();
    fetchMenu();

    const unsubStatus = socketService.onStatusChange((status) => {
      setWsConnected(status);
      if (status) {
        fetchActiveOrders();
        fetchMenu();
      }
    });

    // Subscribe to STOMP staff destination: /topic/staff/orders
    const unsubStaffOrders = socketService.subscribe('/topic/staff/orders', (event) => {
      // Refresh or merge updated orders
      fetchActiveOrders();
    });

    // Subscribe to STOMP dishes destination
    const unsubDishes = socketService.subscribe('/topic/dishes', (event) => {
      if (event.type === 'DISH_AVAILABILITY_UPDATED') {
        setDishes((prev) =>
          prev.map((d) => (d.id === event.dishId ? { ...d, available: event.available } : d))
        );
      }
    });

    return () => {
      unsubStatus();
      unsubStaffOrders();
      unsubDishes();
    };
  }, []);

  async function fetchActiveOrders() {
    try {
      const data = await orderService.getStaffActiveOrders();
      setActiveOrders(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch incoming orders.');
    } finally {
      setLoadingOrders(false);
    }
  }

  async function fetchMenu() {
    setLoadingMenu(true);
    try {
      const data = await menuService.getDishes();
      setDishes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMenu(false);
    }
  }

  async function handleStatusTransition(orderId, nextStatus) {
    setActionInProgress(`status-${orderId}`);
    setError('');
    try {
      const updated = await orderService.updateOrderStatus(orderId, nextStatus);
      showSuccess(`Order ${updated.tokenNumber} updated to ${nextStatus}.`);
      fetchActiveOrders();
    } catch (err) {
      setError(err.message || 'Failed to update order status.');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleMarkPaymentPaid(orderId) {
    setActionInProgress(`pay-${orderId}`);
    setError('');
    try {
      const updated = await orderService.updatePaymentStatus(orderId, 'PAID');
      showSuccess(`Cash payment confirmed for token ${updated.tokenNumber}.`);
      fetchActiveOrders();
    } catch (err) {
      setError(err.message || 'Failed to update payment status.');
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleToggleAvailability(dishId, currentAvailability) {
    setActionInProgress(`dish-${dishId}`);
    setError('');
    try {
      const newAvailability = !currentAvailability;
      await menuService.updateDishAvailability(dishId, newAvailability);
      setDishes((prev) =>
        prev.map((d) => (d.id === dishId ? { ...d, available: newAvailability } : d))
      );
      showSuccess(`Availability updated.`);
    } catch (err) {
      setError(err.message || 'Failed to update dish availability.');
    } finally {
      setActionInProgress(null);
    }
  }

  function openDishForm(dish = null) {
    setEditingDish(dish);
    setDishForm(dish ? {
      name: dish.name,
      description: dish.description || '',
      price: String(dish.price),
      imageUrl: dish.imageUrl || '',
      category: dish.category,
      available: dish.available,
    } : {
      name: '',
      description: '',
      price: '',
      imageUrl: '',
      category: 'Breakfast',
      available: true,
    });
    setError('');
    setSuccessMsg('');
    setDishFormOpen(true);
  }

  async function handleSaveDish(event) {
    event.preventDefault();
    setActionInProgress('save-dish');
    setError('');
    try {
      const dishData = {
        ...dishForm,
        name: dishForm.name.trim(),
        description: dishForm.description.trim(),
        price: Number(dishForm.price),
        imageUrl: dishForm.imageUrl.trim() || null,
        category: dishForm.category.trim(),
      };
      if (editingDish) {
        await menuService.updateDish(editingDish.id, dishData);
        showSuccess(`${dishData.name} updated.`);
      } else {
        await menuService.createDish(dishData);
        showSuccess(`${dishData.name} added to the menu.`);
      }
      setDishFormOpen(false);
      setEditingDish(null);
      await fetchMenu();
    } catch (err) {
      setError(err.message || 'Failed to save menu item.');
    } finally {
      setActionInProgress(null);
    }
  }

  function showSuccess(msg) {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  }

  const filteredOrders = activeOrders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.status === statusFilter;
  });

  return (
    <div className="container main-content" style={{ paddingTop: '32px' }}>
      {/* Staff Dashboard Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: 'var(--heading-md)', color: 'var(--color-forest-deep)', fontWeight: 900 }}>
              Canteen Staff Console
            </h1>
            <span className="badge badge-success" style={{ backgroundColor: 'var(--color-forest)', color: 'white' }}>
              STAFF
            </span>
          </div>
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Manage live kitchen queue, prepare orders, mark payments, and toggle dish availability
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              fetchActiveOrders();
              fetchMenu();
            }}
            className="btn btn-outline btn-sm"
          >
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {!wsConnected && (
        <div className="alert alert-warning" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <WifiOff size={18} />
          <span>Reconnecting to real-time events broker...</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Tabs: Live Queue vs Menu Availability */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '28px',
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        <button
          onClick={() => setActiveTab('QUEUE')}
          style={{
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: 'var(--text-base)',
            color: activeTab === 'QUEUE' ? 'var(--color-tomato)' : 'var(--color-muted)',
            borderBottom: activeTab === 'QUEUE' ? '3px solid var(--color-tomato)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={18} />
          <span>Live Order Queue ({activeOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('MENU')}
          style={{
            padding: '12px 24px',
            fontWeight: 800,
            fontSize: 'var(--text-base)',
            color: activeTab === 'MENU' ? 'var(--color-tomato)' : 'var(--color-muted)',
            borderBottom: activeTab === 'MENU' ? '3px solid var(--color-tomato)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <UtensilsCrossed size={18} />
          <span>Dish Availability Toggle ({dishes.length})</span>
        </button>
      </div>

      {/* TAB 1: LIVE ORDER QUEUE */}
      {activeTab === 'QUEUE' && (
        <div>
          {/* Status Filter Chips */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '24px',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
              Filter Queue:
            </span>
            {['ALL', 'PLACED', 'ACCEPTED', 'PREPARING', 'READY'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`category-chip ${statusFilter === st ? 'active' : ''}`}
                style={{ fontSize: 'var(--text-xs)', padding: '6px 14px' }}
              >
                {st}
              </button>
            ))}
          </div>

          {loadingOrders ? (
            <LoadingSpinner text="Fetching active kitchen queue..." />
          ) : filteredOrders.length === 0 ? (
            <div
              style={{
                backgroundColor: 'var(--color-white)',
                padding: '48px 24px',
                borderRadius: 'var(--radius-card)',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <CheckCircle2 size={40} color="var(--color-forest)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800 }}>No active orders right now</h3>
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
                New orders placed by students will appear in this queue automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
              {filteredOrders.map((order) => {
                const isPaid = order.paymentStatus === 'PAID';

                return (
                  <div
                    key={order.id}
                    style={{
                      backgroundColor: 'var(--color-white)',
                      borderRadius: 'var(--radius-card)',
                      border: '2px solid var(--color-border)',
                      boxShadow: 'var(--shadow-card)',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div>
                      {/* Token & Status Header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '12px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '1.4rem',
                            fontWeight: 900,
                            color: 'var(--color-forest-deep)',
                            backgroundColor: 'var(--color-cream)',
                            padding: '4px 12px',
                            borderRadius: 'var(--radius-control)',
                          }}
                        >
                          {order.tokenNumber}
                        </span>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      {/* User & Time placed */}
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', marginBottom: '16px' }}>
                        <div>Student: <strong>{order.userName}</strong> ({order.userEmail})</div>
                        <div>
                          Placed at: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                      </div>

                      {/* Items list */}
                      <div
                        style={{
                          backgroundColor: 'var(--color-cream-light)',
                          padding: '12px',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '16px',
                        }}
                      >
                        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--color-forest-deep)', marginBottom: '6px' }}>
                          ORDER ITEMS:
                        </div>
                        {order.items.map((i) => (
                          <div
                            key={i.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: 'var(--text-sm)',
                              padding: '3px 0',
                            }}
                          >
                            <span>
                              <strong>{i.quantity}×</strong> {i.dishName}
                            </span>
                            <span style={{ fontWeight: 700 }}>₹{Number(i.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Total and Payment */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '20px',
                          paddingTop: '8px',
                          borderTop: '1px solid var(--color-border)',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>Amount to collect:</div>
                          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--color-forest-deep)' }}>
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <PaymentStatusBadge paymentStatus={order.paymentStatus} />
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Cash collection button */}
                      {!isPaid && (
                        <button
                          onClick={() => handleMarkPaymentPaid(order.id)}
                          disabled={actionInProgress === `pay-${order.id}`}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: 'var(--color-success)', color: 'var(--color-forest-deep)' }}
                        >
                          <DollarSign size={16} />
                          <span>Mark Cash Collected (₹{Number(order.totalAmount).toFixed(2)})</span>
                        </button>
                      )}

                      {/* Progression actions */}
                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'ACCEPTED')}
                          disabled={actionInProgress === `status-${order.id}`}
                          className="btn btn-primary btn-sm btn-full"
                        >
                          <CheckCircle2 size={16} />
                          <span>Accept Order</span>
                        </button>
                      )}

                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'PREPARING')}
                          disabled={actionInProgress === `status-${order.id}`}
                          className="btn btn-primary btn-sm btn-full"
                          style={{ backgroundColor: '#D97706' }}
                        >
                          <ChefHat size={16} />
                          <span>Start Preparing</span>
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'READY')}
                          disabled={actionInProgress === `status-${order.id}`}
                          className="btn btn-primary btn-sm btn-full"
                          style={{ backgroundColor: 'var(--color-forest)' }}
                        >
                          <Sparkles size={16} />
                          <span>Mark Ready for Pickup</span>
                        </button>
                      )}

                      {order.status === 'READY' && (
                        <button
                          onClick={() => handleStatusTransition(order.id, 'COMPLETED')}
                          disabled={actionInProgress === `status-${order.id}`}
                          className="btn btn-secondary btn-sm btn-full"
                        >
                          <CheckCircle2 size={16} />
                          <span>Complete &amp; Hand Over</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MENU AVAILABILITY TOGGLE */}
      {activeTab === 'MENU' && (
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--color-border)',
            padding: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '8px' }}>
                Live Menu Availability Control
              </h2>
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-sm)' }}>
                Toggle availability, add dishes, or edit existing menu items.
              </p>
            </div>
            <button onClick={() => openDishForm()} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Item
            </button>
          </div>

          {dishFormOpen && (
            <form onSubmit={handleSaveDish} className="form-card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, marginBottom: '20px' }}>
                {editingDish ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="dish-name">Name</label>
                  <input id="dish-name" className="form-input" value={dishForm.name} maxLength={120} required
                    onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dish-price">Price (₹)</label>
                  <input id="dish-price" className="form-input" type="number" min="0.01" step="0.01" value={dishForm.price} required
                    onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dish-category">Category</label>
                  <input id="dish-category" className="form-input" value={dishForm.category} maxLength={60} required list="canteen-categories"
                    onChange={(event) => setDishForm({ ...dishForm, category: event.target.value })} />
                  <datalist id="canteen-categories">
                    {['Breakfast', 'Meals', 'North Indian', 'Snacks', 'Beverages', 'Desserts'].map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="dish-image">Image URL (optional)</label>
                  <input id="dish-image" className="form-input" type="url" value={dishForm.imageUrl}
                    onChange={(event) => setDishForm({ ...dishForm, imageUrl: event.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="dish-description">Description</label>
                <textarea id="dish-description" className="form-input" rows={3} maxLength={5000} value={dishForm.description}
                  onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontWeight: 700 }}>
                <input type="checkbox" checked={dishForm.available}
                  onChange={(event) => setDishForm({ ...dishForm, available: event.target.checked })} />
                Available for ordering
              </label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button type="submit" className="btn btn-primary btn-sm" disabled={actionInProgress === 'save-dish'}>
                  {actionInProgress === 'save-dish' ? 'Saving…' : editingDish ? 'Save Changes' : 'Add Menu Item'}
                </button>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setDishFormOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dishes.map((dish) => (
              <div
                key={dish.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: dish.available ? 'var(--color-cream-light)' : '#F9FAFB',
                  border: dish.available ? '1.5px solid var(--color-border)' : '1.5px solid #E5E7EB',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {dish.imageUrl && (
                    <img
                      src={dish.imageUrl}
                      alt={dish.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: 'var(--radius-sm)',
                        objectFit: 'cover',
                        filter: dish.available ? 'none' : 'grayscale(80%)',
                      }}
                    />
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: 'var(--text-base)', color: 'var(--color-ink)' }}>
                        {dish.name}
                      </strong>
                      <span className="badge badge-neutral" style={{ fontSize: '10px' }}>
                        {dish.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-forest-deep)', fontWeight: 700 }}>
                      ₹{Number(dish.price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button onClick={() => openDishForm(dish)} className="btn btn-outline btn-sm">
                    <Pencil size={14} /> Edit
                  </button>
                  <span
                    className={`badge ${dish.available ? 'badge-success' : 'badge-danger'}`}
                    style={{ padding: '6px 14px' }}
                  >
                    {dish.available ? 'Available' : 'Sold Out'}
                  </span>

                  <button
                    onClick={() => handleToggleAvailability(dish.id, dish.available)}
                    disabled={actionInProgress === `dish-${dish.id}`}
                    className={`btn btn-sm ${dish.available ? 'btn-danger' : 'btn-primary'}`}
                    style={{ minWidth: '160px' }}
                  >
                    {dish.available ? 'Mark as Sold Out' : 'Mark as Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
