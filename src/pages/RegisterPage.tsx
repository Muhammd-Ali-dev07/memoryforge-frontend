import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Brain, UserPlus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
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

    // Validation
    if (!username.trim()) {
      setError('Please enter a username');
      return;
    }

    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!password) {
      setError('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), password, email.trim() || undefined);
      navigate('/chat');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const passwordStrong = password.length >= 6;
  const usernameValid = username.trim().length >= 3;

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
                placeholder="Choose a username (min 3 characters)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoFocus
                autoComplete="username"
              />
              {username.trim() && (
                <div className="password-strength">
                  {usernameValid ? (
                    <span className="strength-good">
                      <CheckCircle2 size={16} /> Valid username
                    </span>
                  ) : (
                    <span className="strength-weak">Minimum 3 characters required</span>
                  )}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Email (Optional)</label>
              <input
                type="email"
                className="input"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="input"
                placeholder="Create a strong password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
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
                disabled={loading}
                autoComplete="new-password"
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

            <button 
              type="submit" 
              className="btn btn-primary btn-full" 
              disabled={loading || !usernameValid || !passwordStrong || !passwordsMatch}
            >
              {loading ? (
                <>
                  <Loader2 className="spinner-icon" size={20} />
                  <span>Creating account...</span>
                </>
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