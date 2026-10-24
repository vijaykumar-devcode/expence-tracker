import axios from 'axios';
const API = axios.create({ baseURL: '/api/finance', withCredentials: true });
export const getFinanceSummary = async (month) => (await API.get('/summary', { params: { month } })).data;
