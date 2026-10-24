import axios from 'axios';

const API = axios.create({
  baseURL: '/api/expenses',
  withCredentials: true,
});

export const getExpenses = async (params) => {
  const { data } = await API.get('/', { params });
  return data;
};

export const getExpenseById = async (id) => {
  const { data } = await API.get(`/${id}`);
  return data;
};

export const createExpense = async (expenseData) => {
  const { data } = await API.post('/', expenseData);
  return data;
};

export const updateExpense = async (id, expenseData) => {
  const { data } = await API.put(`/${id}`, expenseData);
  return data;
};

export const deleteExpense = async (id) => {
  const { data } = await API.delete(`/${id}`);
  return data;
};

export const getSummary = async () => {
  const { data } = await API.get('/summary');
  return data;
};
