import api from '../api';

const API = api;

export const register = async (userData) => {
  const { data } = await API.post('/api/auth/register', userData);
  return data;
};

export const login = async (credentials) => {
  const { data } = await API.post('/api/auth/login', credentials);
  return data;
};

export const logout = async () => {
  const { data } = await API.post('/api/auth/logout');
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await API.get('/api/auth/me');
  return data;
};
