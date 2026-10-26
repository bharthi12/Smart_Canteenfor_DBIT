import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { UtensilsCrossed, ShoppingBag, Clock, ShieldCheck, LogOut, Menu, X, User } from 'lucide-react';

export function Navbar() {
  const { user, isStaff, isStudent, logout } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to={isStaff ? '/staff' : '/menu'} className="logo-area">
          <UtensilsCrossed size={28} color="var(--color-yellow)" />
          <span>Smart Canteen</span>
          {isStaff && <span className="logo-badge">Staff Panel</span>}
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav" style={{ display: 'flex' }}>
          {isStudent && (
            <>
              <NavLink to="/menu" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <UtensilsCrossed size={16} />
                <span>Menu</span>
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Clock size={16} />
                <span>My Orders</span>
              </NavLink>
              <Link to="/cart" className="cart-indicator">
                <ShoppingBag size={18} />
                <span>Cart</span>
                {totalCount > 0 && <span className="cart-badge">{totalCount}</span>}
              </Link>
            </>
          )}

          {isStaff && (
            <>
              <NavLink to="/staff" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={16} />
                <span>Order Queue &amp; Menu</span>
              </NavLink>
            </>
          )}

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-white)' }}>
                  {user.name}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-yellow)' }}>
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{ color: 'var(--color-cream)', borderColor: 'rgba(255,255,255,0.3)' }}
                title="Log out"
              >
                <LogOut size={16} />
                <span style={{ display: 'none' }}>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
