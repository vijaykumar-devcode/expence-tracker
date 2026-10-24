import axios from 'axios';
const API = axios.create({ baseURL: '/api/auth', withCredentials: true });
export const changePassword = async (data) => (await API.post('/change-password', data)).data;
export const updateProfile = async (data) => (await API.put('/profile', data)).data;
