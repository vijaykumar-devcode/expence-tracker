import api from '../api';

const API = api;
export const getRecurring = async () => (await API.get('/api/recurring/')).data;
export const createRecurring = async (data) => (await API.post('/api/recurring/', data)).data;
export const updateRecurring = async (id, data) => (await API.put(`/api/recurring/${id}`, data)).data;
export const setRecurringStatus = async (id, active) => (await API.patch(`/api/recurring/${id}/status`, { active })).data;
export const deleteRecurring = async (id) => (await API.delete(`/api/recurring/${id}`)).data;
export const processRecurring = async () => (await API.post('/api/recurring/process-due')).data;
