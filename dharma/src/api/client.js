import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const client = axios.create({ baseURL: BASE });

/* Attach JWT on every request */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dharma_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
