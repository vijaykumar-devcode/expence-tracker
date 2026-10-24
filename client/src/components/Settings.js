import React, { useState } from 'react';
import { changePassword, updateProfile } from '../api/settingsApi';
import './Settings.css';

const Settings = ({ user, onProfileUpdated, onLogout }) => {
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const submitProfile = async (event) => {
    event.preventDefault();
    try {
      setError(''); setMessage('');
      const result = await updateProfile(profile);
      onProfileUpdated(result.user);
      setMessage('Profile updated successfully.');
    } catch (err) { setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to update profile.'); }
  };
  const submitPassword = async (event) => {
    event.preventDefault();
    try {
      setError(''); setMessage('');
      await changePassword(password);
      setPassword({ currentPassword: '', newPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err) { setError(err.response?.data?.errors?.join(', ') || err.response?.data?.message || 'Unable to change password.'); }
  };
  return (
    <div className="settings-container">
      <form className="expense-form-card settings-card" onSubmit={submitProfile}>
        <h2>Profile</h2><p>Keep your account details up to date.</p>
        <label className="form-label" htmlFor="settings-name">Name</label>
        <input id="settings-name" className="form-input" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required maxLength="80" />
        <label className="form-label" htmlFor="settings-email">Email</label>
        <input id="settings-email" className="form-input" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required />
        <button className="btn-add-expense" type="submit">Save profile</button>
      </form>
      <form className="expense-form-card settings-card" onSubmit={submitPassword}>
        <h2>Security</h2><p>Changing your password requires your current password.</p>
        <label className="form-label" htmlFor="current-password">Current password</label>
        <input id="current-password" className="form-input" type="password" value={password.currentPassword} onChange={(e) => setPassword({ ...password, currentPassword: e.target.value })} required />
        <label className="form-label" htmlFor="new-password">New password</label>
        <input id="new-password" className="form-input" type="password" minLength="8" value={password.newPassword} onChange={(e) => setPassword({ ...password, newPassword: e.target.value })} required />
        <button className="btn-add-expense" type="submit">Change password</button>
      </form>
      <div className="expense-form-card settings-card settings-account-card">
        <h2>Account</h2>
        <p>Sign out of this device when you are finished using Expense Tracker.</p>
        <button className="header-logout settings-logout" type="button" onClick={onLogout}>Log out</button>
      </div>
      {message && <div className="table-success">{message}</div>}
      {error && <div className="table-error">{error}</div>}
    </div>
  );
};
export default Settings;
