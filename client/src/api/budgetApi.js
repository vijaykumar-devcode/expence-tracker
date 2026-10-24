import axios from 'axios';

const API = axios.create({ baseURL: '/api/budgets', withCredentials: true });

export const getBudgets = async (month) => (await API.get('/', { params: { month } })).data;
export const createBudget = async (budget) => (await API.post('/', budget)).data;
export const updateBudget = async (id, amount) => (await API.put(`/${id}`, { amount })).data;
export const deleteBudget = async (id) => (await API.delete(`/${id}`)).data;
