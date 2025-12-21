import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react';
import './AuthPages.css';

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(username, password, email);
      navigate('/chat');
    } catch (err) {
      setError('Username already exists or registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordStrong = password.length >= 6;

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="grid-overlay"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <div className="auth-container fade-in">
        <div className="auth-card">
          <div className="auth-header">
            <Brain className="auth-icon" size={48} />
            <h1>Create Account</h1>
            <p>Join MemoryForge and start your AI journey</p>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="input"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus
                minLength={3}
              />
            </div>

            <div className="form-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {password && (
                <div className="password-strength">
                  {passwordStrong ? (
                    <span className="strength-good">
                      <CheckCircle2 size={16} /> Strong password
                    </span>
                  ) : (
                    <span className="strength-weak">At least 6 characters required</span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                className="input"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && (
                <div className="password-strength">
                  {passwordsMatch ? (
                    <span className="strength-good">
                      <CheckCircle2 size={16} /> Passwords match
                    </span>
                  ) : (
                    <span className="strength-weak">Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in
              </Link>
            </p>
            <Link to="/" className="auth-link-secondary">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;