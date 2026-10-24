import axios from 'axios';
const API = axios.create({ baseURL: '/api/income', withCredentials: true });
export const getIncome = async (params) => (await API.get('/', { params })).data;
export const getIncomeById = async (id) => (await API.get(`/${id}`)).data;
export const createIncome = async (data) => (await API.post('/', data)).data;
export const updateIncome = async (id, data) => (await API.put(`/${id}`, data)).data;
export const deleteIncome = async (id) => (await API.delete(`/${id}`)).data;
