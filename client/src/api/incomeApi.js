import api from '../api';
const API = api;
export const getIncome = async (params) => (await API.get('/api/income/', { params })).data;
export const getIncomeById = async (id) => (await API.get(`/api/income/${id}`)).data;
export const createIncome = async (data) => (await API.post('/api/income/', data)).data;
export const updateIncome = async (id, data) => (await API.put(`/api/income/${id}`, data)).data;
export const deleteIncome = async (id) => (await API.delete(`/api/income/${id}`)).data;
