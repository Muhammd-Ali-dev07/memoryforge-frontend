import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  User,
  Mail,
  Lock,
  ArrowLeft,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  LogOut
} from 'lucide-react';
import './ProfilePage.css';

const API_URL = 'http://13.60.92.19:8080';
//const API_URL = 'http://localhost:8080';

interface UserProfile {
  userId: string;
  username: string;
  email: string;
  createdAt: number;
  lastLogin: number;
}

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit profile state
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Change password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Notifications
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        headers: { Authorization: `Bearer ${user?.sessionToken}` }
      });

      if (!response.ok) throw new Error('Failed to load profile');

      const data = await response.json();
      setProfile(data);
      setUsername(data.username);
      setEmail(data.email || '');
    } catch (error) {
      console.error('Failed to load profile:', error);
      showError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!username.trim()) {
      showError('Username cannot be empty');
      return;
    }

    if (username.trim().length < 3) {
      showError('Username must be at least 3 characters');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      await loadProfile();
      setEditMode(false);
      showSuccess('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      showError(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setUsername(profile?.username || '');
    setEmail(profile?.email || '');
    setEditMode(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      showError('Please enter your current password');
      return;
    }

    if (!newPassword) {
      showError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      showError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await fetch(`${API_URL}/api/user/password`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user?.sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
      showSuccess('Password changed successfully!');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      showError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const passwordStrong = newPassword.length >= 6;

  return (
    <div className="profile-page">
      <div className="profile-background">
        <div className="grid-overlay"></div>
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      {/* Toast Notifications */}
      {error && (
        <div className="toast toast-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}
      
      {success && (
        <div className="toast toast-success">
          <Check size={20} />
          <span>{success}</span>
        </div>
      )}

      <div className="profile-container">
        {/* Header */}
        <div className="profile-header">
          <button className="btn-back" onClick={() => navigate('/chat')}>
            <ArrowLeft size={20} />
            <span>Back to Chat</span>
          </button>
          <div className="header-title">
            <Brain size={32} />
            <h1>Account Settings</h1>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <Loader2 className="spinner-icon" size={48} />
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="profile-content">
            {/* Profile Information Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <User size={24} />
                  <h2>Profile Information</h2>
                </div>
                {!editMode && (
                  <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>

              <div className="card-content">
                {editMode ? (
                  <>
                    <div className="form-group">
                      <label>
                        <User size={18} />
                        Username
                      </label>
                      <input
                        type="text"
                        className="input"
                        placeholder="Enter username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        disabled={saving}
                      />
                      {username.trim() && username.trim().length < 3 && (
                        <span className="input-hint error">Minimum 3 characters required</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label>
                        <Mail size={18} />
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        className="input"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={saving}
                      />
                    </div>

                    <div className="form-actions">
                      <button 
                        className="btn btn-secondary" 
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={handleSaveProfile}
                        disabled={saving || !username.trim() || username.trim().length < 3}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="spinner-icon" size={18} />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save size={18} />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="info-row">
                      <span className="info-label">Username</span>
                      <span className="info-value">{profile?.username}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Email</span>
                      <span className="info-value">{profile?.email || 'Not set'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">User ID</span>
                      <span className="info-value info-id">{profile?.userId}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Member since</span>
                      <span className="info-value">{profile && formatDate(profile.createdAt)}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Last login</span>
                      <span className="info-value">{profile && formatDate(profile.lastLogin)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Change Password Card */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <Lock size={24} />
                  <h2>Security</h2>
                </div>
                {!showPasswordSection && (
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setShowPasswordSection(true)}
                  >
                    Change Password
                  </button>
                )}
              </div>

              {showPasswordSection && (
                <div className="card-content">
                  <div className="form-group">
                    <label>
                      <Lock size={18} />
                      Current Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                      <button
                        className="password-toggle"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        type="button"
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <Lock size={18} />
                      New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Enter new password (min 6 characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                      <button
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        type="button"
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {newPassword && (
                      <span className={`input-hint ${passwordStrong ? 'success' : 'error'}`}>
                        {passwordStrong ? '✓ Strong password' : 'At least 6 characters required'}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>
                      <Lock size={18} />
                      Confirm New Password
                    </label>
                    <div className="password-input-wrapper">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={changingPassword}
                      />
                      <button
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        type="button"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmPassword && (
                      <span className={`input-hint ${passwordsMatch ? 'success' : 'error'}`}>
                        {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match'}
                      </span>
                    )}
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowPasswordSection(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      disabled={changingPassword}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleChangePassword}
                      disabled={
                        changingPassword || 
                        !currentPassword || 
                        !passwordStrong || 
                        !passwordsMatch
                      }
                    >
                      {changingPassword ? (
                        <>
                          <Loader2 className="spinner-icon" size={18} />
                          <span>Changing...</span>
                        </>
                      ) : (
                        <>
                          <Save size={18} />
                          <span>Change Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone Card */}
            <div className="card card-danger">
              <div className="card-header">
                <div className="card-title">
                  <AlertCircle size={24} />
                  <h2>Danger Zone</h2>
                </div>
              </div>
              <div className="card-content">
                <div className="danger-zone-content">
                  <div>
                    <h3>Logout from all devices</h3>
                    <p>This will end your current session and require you to log in again.</p>
                  </div>
                  <button className="btn btn-danger" onClick={handleLogout}>
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;