import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Menu } from './pages/Menu';
import { Cart } from './pages/Cart';
import { MyOrders } from './pages/MyOrders';
import { OrderTracking } from './pages/OrderTracking';
import { StaffDashboard } from './pages/StaffDashboard';

// Styles
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <div className="app-shell">
            <Navbar />

            <main>
              <Routes>
                {/* Public / Auth routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Student routes */}
                <Route
                  path="/menu"
                  element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <Menu />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <Cart />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute requiredRole="STUDENT">
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <OrderTracking />
                    </ProtectedRoute>
                  }
                />

                {/* Staff routes */}
                <Route
                  path="/staff"
                  element={
                    <ProtectedRoute requiredRole="STAFF">
                      <StaffDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Default redirect to menu */}
                <Route path="/" element={<Navigate to="/menu" replace />} />
                <Route path="*" element={<Navigate to="/menu" replace />} />
              </Routes>
            </main>

            <footer className="site-footer">
              <div className="container footer-inner">
                <div>
                  <strong style={{ color: 'var(--color-yellow)', fontSize: 'var(--text-base)', display: 'block', marginBottom: '4px' }}>
                    Smart Canteen Management
                  </strong>
                  <span style={{ color: 'var(--color-cream)', fontSize: 'var(--text-xs)' }}>
                    Campus Meal Ordering &bull; Cash at Counter &bull; Real-time Token Tracking
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-border)' }}>
                  &copy; {new Date().getFullYear()} College Canteen Services. All rights reserved.
                </div>
              </div>
            </footer>
          </div>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
