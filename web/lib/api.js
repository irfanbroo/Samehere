import axios from 'axios';

const api = axios.create({
  baseURL: 'https://samehere-ts2raneh.usw-1.sealos.app',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
