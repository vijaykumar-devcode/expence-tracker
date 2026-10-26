import api from '../api';
const API = api;

export const getBudgets = async (month) => (await API.get('/api/budgets/', { params: { month } })).data;
export const createBudget = async (budget) => (await API.post('/api/budgets/', budget)).data;
export const updateBudget = async (id, amount) => (await API.put(`/api/budgets/${id}`, { amount })).data;
export const deleteBudget = async (id) => (await API.delete(`/api/budgets/${id}`)).data;
