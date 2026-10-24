import React, { useState } from 'react';
import { login, register } from '../api/authApi';
import './AuthPage.css';

const AuthPage = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('login');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isRegistering = mode === 'register';

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  };

  const validate = () => {
    const nextErrors = {};
    if (isRegistering && (formData.name.trim().length < 2 || formData.name.trim().length > 80)) {
      nextErrors.name = 'Name must be between 2 and 80 characters';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Enter a valid email address';
    }
    if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      setServerError('');
      const response = isRegistering
        ? await register(formData)
        : await login({ email: formData.email, password: formData.password });
      onAuthenticated(response.user);
    } catch (error) {
      const responseErrors = error.response?.data?.errors;
      setServerError(responseErrors?.join(', ') || error.response?.data?.message || 'Unable to authenticate');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(isRegistering ? 'login' : 'register');
    setFormData({ name: '', email: '', password: '' });
    setErrors({});
    setServerError('');
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card-brand">Expense Tracker</div>
        <h1 className="auth-title">{isRegistering ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">
          {isRegistering ? 'Start tracking your spending securely.' : 'Sign in to manage your expenses.'}
        </p>

        {serverError && <div className="auth-alert">{serverError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {isRegistering && (
            <div className="auth-field">
              <label htmlFor="auth-name">Name</label>
              <input id="auth-name" name="name" value={formData.name} onChange={handleChange} autoComplete="name" />
              {errors.name && <span>{errors.name}</span>}
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="auth-email">Email</label>
            <input id="auth-email" name="email" type="email" value={formData.email} onChange={handleChange} autoComplete="email" />
            {errors.email && <span>{errors.email}</span>}
          </div>
          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input id="auth-password" name="password" type="password" value={formData.password} onChange={handleChange} autoComplete={isRegistering ? 'new-password' : 'current-password'} />
            {errors.password && <span>{errors.password}</span>}
          </div>
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Please wait...' : isRegistering ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button className="auth-switch" type="button" onClick={switchMode}>
          {isRegistering ? 'Already have an account? Sign in' : 'Need an account? Create one'}
        </button>
      </section>
    </main>
  );
};

export default AuthPage;
