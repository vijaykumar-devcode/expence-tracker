import axios from 'axios';

const API = axios.create({ baseURL: '/api/recurring', withCredentials: true });
export const getRecurring = async () => (await API.get('/')).data;
export const createRecurring = async (data) => (await API.post('/', data)).data;
export const updateRecurring = async (id, data) => (await API.put(`/${id}`, data)).data;
export const setRecurringStatus = async (id, active) => (await API.patch(`/${id}/status`, { active })).data;
export const deleteRecurring = async (id) => (await API.delete(`/${id}`)).data;
export const processRecurring = async () => (await API.post('/process-due')).data;
