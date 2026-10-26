import api from '../api';
const API = api;
export const getReport = async (params) => (await API.get('/api/reports/', { params })).data;
export const downloadReport = async (params) => {
  const response = await API.get('/api/reports/csv', { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'finance-report.csv';
  link.click();
  URL.revokeObjectURL(url);
};
