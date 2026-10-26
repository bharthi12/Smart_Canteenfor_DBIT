import React, { useState, useEffect } from 'react';
import { menuService } from '../services/menuService';
import { socketService } from '../services/socketService';
import { DishCard } from '../components/DishCard';
import { LoadingSpinner } from '../components/LoadingState';
import { EmptyState } from '../components/EmptyState';
import { Search, Filter, RefreshCw, WifiOff, Sparkles } from 'lucide-react';

export function Menu() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [wsConnected, setWsConnected] = useState(true);

  useEffect(() => {
    fetchDishes();

    // Listen to WebSocket connection status
    const unsubStatus = socketService.onStatusChange(status => {
      setWsConnected(status);
      if (status) {
        // Refetch dishes when reconnected
        fetchDishes();
      }
    });

    // Subscribe to real-time dish availability events
    const unsubDishEvents = socketService.subscribe('/topic/dishes', (event) => {
      if (event.type === 'DISH_AVAILABILITY_UPDATED') {
        setDishes(prev =>
          prev.map(d => (d.id === event.dishId ? { ...d, available: event.available } : d))
        );
      }
    });

    return () => {
      unsubStatus();
      unsubDishEvents();
    };
  }, []);

  async function fetchDishes() {
    try {
      setError(null);
      const data = await menuService.getDishes();
      setDishes(data);
    } catch (err) {
      setError(err.message || 'Failed to load canteen menu.');
    } finally {
      setLoading(false);
    }
  }

  // Derive unique categories from actual dishes
  const categories = ['All', ...new Set(dishes.map(d => d.category))];

  const filteredDishes = dishes.filter(dish => {
    const matchesCategory = selectedCategory === 'All' || dish.category === selectedCategory;
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (dish.description && dish.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAvailability = !availableOnly || dish.available;
    return matchesCategory && matchesSearch && matchesAvailability;
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="hero-banner">
        <div className="container">
          <div className="hero-content">
            <span className="hero-tagline">
              <Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              Fresh &bull; Fast &bull; Campus Made
            </span>
            <h1 className="hero-title">Your next campus favourite.</h1>
            <p className="hero-subtitle">
              Browse our freshly prepared menu, place your order in seconds, and pay cash at the counter when you pick it up!
            </p>
          </div>
        </div>
      </section>

      <div className="container main-content">
        {!wsConnected && (
          <div
            className="alert alert-warning"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <WifiOff size={18} />
              <span>Reconnecting to live menu updates...</span>
            </div>
            <button
              onClick={fetchDishes}
              className="btn btn-outline btn-sm"
              style={{ borderColor: 'var(--color-warning)' }}
            >
              <RefreshCw size={14} /> Refresh Menu
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-white)',
            padding: '20px',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            marginBottom: '32px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              marginBottom: '16px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--color-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '40px' }}
                placeholder="Search by dish name or ingredient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Available Only Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                color: 'var(--color-forest-deep)',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-forest)' }}
              />
              <span>Available Only</span>
            </label>
          </div>

          {/* Category Chips */}
          <div className="category-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingSpinner text="Fetching fresh canteen menu..." />
        ) : error ? (
          <div className="alert alert-danger" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontWeight: 700, marginBottom: '12px' }}>{error}</p>
            <button onClick={fetchDishes} className="btn btn-outline btn-sm">
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        ) : filteredDishes.length === 0 ? (
          <EmptyState
            title="No dishes found"
            description="We couldn't find any dishes matching your current search and filter criteria."
            actionText="Clear Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setAvailableOnly(false);
            }}
          />
        ) : (
          <div className="dish-grid">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
