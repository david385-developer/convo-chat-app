import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-branding desktop-only">
        <div className="branding-content">
          <Link to="/" className="landing-logo">Convo<span>.</span></Link>
          <h1 className="branding-title">Welcome back!</h1>
          <p className="branding-text">
            Reconnect with your team and pick up where you left off.
          </p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card animate-fadeUp">
          <div className="auth-header">
            <Link to="/" className="mobile-logo tablet-mobile-only">Convo<span>.</span></Link>
            <h2>Log in</h2>
            <p>Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="auth-error animate-shake">{error}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
