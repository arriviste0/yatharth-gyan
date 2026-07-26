import axios from 'axios';

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5001/api' : 'https://karma-backend.vercel.app/api');

const client = axios.create({ baseURL: BASE });

/* Attach JWT on every request */
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dharma_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
