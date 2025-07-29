// frontend/src/api/axios.js
import axios from 'axios';
import { store } from '../app/store';

const api = axios.create({
  baseURL: '/api'   // relative to http://localhost:3001
});

api.interceptors.request.use(cfg => {
  const token = store.getState().auth.token;
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;