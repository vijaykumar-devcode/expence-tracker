import api from '../api';
const API = api;
export const changePassword = async (data) => (await API.post('/api/auth/change-password', data)).data;
export const updateProfile = async (data) => (await API.put('/api/auth/profile', data)).data;
