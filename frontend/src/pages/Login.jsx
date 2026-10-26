import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, LogIn, AlertCircle, Sparkles } from 'lucide-react';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const redirectPath = location.state?.from?.pathname || null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (redirectPath) {
        navigate(redirectPath);
      } else if (user.role === 'STAFF') {
        navigate('/staff');
      } else {
        navigate('/menu');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <div className="container-narrow">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-forest)',
              color: 'var(--color-yellow)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)',
              marginBottom: '16px',
            }}
          >
            <UtensilsCrossed size={32} />
          </div>
          <h1 style={{ fontSize: 'var(--heading-md)', color: 'var(--color-forest-deep)', fontWeight: 900 }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--text-base)', marginTop: '6px' }}>
            Log in to order fresh meals or manage the canteen
          </p>
        </div>

        <div className="form-card">
          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                College Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                className="form-input"
                placeholder="e.g. rahul@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: '12px' }}
            >
              <LogIn size={18} />
              <span>{loading ? 'Signing in...' : 'Log In'}</span>
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid var(--color-border)',
              textAlign: 'center',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-muted)',
            }}
          >
            Don't have an account yet?{' '}
            <Link
              to="/register"
              style={{ color: 'var(--color-tomato)', fontWeight: 700 }}
            >
              Create student account
            </Link>
          </div>

          <div
            style={{
              marginTop: '16px',
              backgroundColor: 'var(--color-cream-light)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--color-forest-deep)', marginBottom: '4px' }}>
              Default Accounts for Testing:
            </div>
            <div>Staff: <strong>staff@college.edu</strong> / <strong>staff123</strong></div>
            <div>Student: Register a new account or use any registered email</div>
          </div>
        </div>
      </div>
    </div>
  );
}
