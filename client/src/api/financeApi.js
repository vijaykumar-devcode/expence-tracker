import api from '../api';
const API = api;
export const getFinanceSummary = async (month) => (await API.get('/api/finance/summary', { params: { month } })).data;
