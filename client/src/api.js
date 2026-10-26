import axios from 'axios';

// CRA exposes REACT_APP_* variables at build time. Keep VITE_API_URL as a
// compatibility fallback for a future Vite build without exposing secrets.
const baseURL = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || '';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;