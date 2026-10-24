import axios from 'axios';

const API = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
});

export const register = async (userData) => {
  const { data } = await API.post('/register', userData);
  return data;
};

export const login = async (credentials) => {
  const { data } = await API.post('/login', credentials);
  return data;
};

export const logout = async () => {
  const { data } = await API.post('/logout');
  return data;
};

export const getCurrentUser = async () => {
  const { data } = await API.get('/me');
  return data;
};
