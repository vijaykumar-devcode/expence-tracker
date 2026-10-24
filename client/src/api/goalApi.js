import axios from 'axios';
const API = axios.create({ baseURL: '/api/goals', withCredentials: true });
export const getGoals = async () => (await API.get('/')).data;
export const createGoal = async (data) => (await API.post('/', data)).data;
export const updateGoal = async (id, data) => (await API.put(`/${id}`, data)).data;
export const deleteGoal = async (id) => (await API.delete(`/${id}`)).data;
export const addGoalEntry = async (id, data) => (await API.post(`/${id}/entries`, data)).data;
export const getGoalEntries = async (id) => (await API.get(`/${id}/entries`)).data;
