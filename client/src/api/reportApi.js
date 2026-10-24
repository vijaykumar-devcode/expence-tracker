import axios from 'axios';
const API = axios.create({ baseURL: '/api/reports', withCredentials: true });
export const getReport = async (params) => (await API.get('/', { params })).data;
export const downloadReport = async (params) => {
  const response = await API.get('/csv', { params, responseType: 'blob' });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'finance-report.csv';
  link.click();
  URL.revokeObjectURL(url);
};
