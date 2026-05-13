import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context';
import './RegisterPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setIsLoading(true);
    setError('');

    const submitData = new FormData();
    submitData.append('username', formData.username);
    submitData.append('email', formData.email);
    submitData.append('password', formData.password);
    if (avatar) submitData.append('avatar', avatar);

    const result = await register(submitData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setIsLoading(false);
  };

  const getPasswordStrength = () => {
    const pass = formData.password;
    if (!pass) return 0;
    let strength = 0;
    if (pass.length > 6) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    return strength;
  };

  return (
    <div className="auth-page">
      <div className="auth-branding desktop-only">
        <div className="branding-content">
          <Link to="/" className="landing-logo">Convo<span>.</span></Link>
          <h1 className="branding-title">Join the flow.</h1>
          <p className="branding-text">
            Experience real-time communication that feels as natural as breathing.
          </p>
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card animate-fadeUp">
          <div className="auth-header">
            <Link to="/" className="mobile-logo tablet-mobile-only">Convo<span>.</span></Link>
            <h2>Create Account</h2>
            <p>Fill in the details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="avatar-upload-section">
              <div 
                className="avatar-dropzone"
                onClick={() => document.getElementById('avatar-input').click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" />
                ) : (
                  <div className="avatar-placeholder">
                    <span>+</span>
                  </div>
                )}
              </div>
              <input 
                id="avatar-input" 
                type="file" 
                hidden 
                onChange={handleAvatarChange}
                accept="image/*"
              />
              <span className="upload-label">Upload Profile Picture</span>
            </div>

            <div className="form-group">
              <label>Username</label>
              <input 
                type="text" 
                name="username"
                value={formData.username} 
                onChange={handleInputChange}
                placeholder="charlie_pro"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                name="email"
                value={formData.email} 
                onChange={handleInputChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input 
                type="password" 
                name="password"
                value={formData.password} 
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              <div className="strength-indicator">
                <div className={`bar ${getPasswordStrength() >= 1 ? 'active' : ''}`}></div>
                <div className={`bar ${getPasswordStrength() >= 2 ? 'active' : ''}`}></div>
                <div className={`bar ${getPasswordStrength() >= 3 ? 'active' : ''}`}></div>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword} 
                onChange={handleInputChange}
                placeholder="••••••••"
                required
              />
              {formData.confirmPassword && (
                <span className={`match-label ${formData.password === formData.confirmPassword ? 'match' : 'no-match'}`}>
                  {formData.password === formData.confirmPassword ? '✓ Matches' : '✕ No match'}
                </span>
              )}
            </div>

            {error && <div className="auth-error animate-shake">{error}</div>}

            <button type="submit" className="btn-primary auth-submit" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
