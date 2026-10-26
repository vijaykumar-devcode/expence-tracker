import api from '../api';
const API = api;
export const getGoals = async () => (await API.get('/api/goals/')).data;
export const createGoal = async (data) => (await API.post('/api/goals/', data)).data;
export const updateGoal = async (id, data) => (await API.put(`/api/goals/${id}`, data)).data;
export const deleteGoal = async (id) => (await API.delete(`/api/goals/${id}`)).data;
export const addGoalEntry = async (id, data) => (await API.post(`/api/goals/${id}/entries`, data)).data;
export const getGoalEntries = async (id) => (await API.get(`/api/goals/${id}/entries`)).data;
