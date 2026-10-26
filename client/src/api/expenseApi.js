import api from '../api';

const API = api;

export const getExpenses = async (params) => {
  const { data } = await API.get('/api/expenses/', { params });
  return data;
};

export const getExpenseById = async (id) => {
  const { data } = await API.get(`/api/expenses/${id}`);
  return data;
};

export const createExpense = async (expenseData) => {
  const { data } = await API.post('/api/expenses/', expenseData);
  return data;
};

export const updateExpense = async (id, expenseData) => {
  const { data } = await API.put(`/api/expenses/${id}`, expenseData);
  return data;
};

export const deleteExpense = async (id) => {
  const { data } = await API.delete(`/api/expenses/${id}`);
  return data;
};

export const getSummary = async () => {
  const { data } = await API.get('/api/expenses/summary');
  return data;
};
