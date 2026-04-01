import axios from 'axios';

// When running in Vite dev server (PROD is false), we fetch data from localhost:5000.
// When compiled for production in Docker (PROD is true), the frontend and API share the exact same origin.
const API = axios.create({
  baseURL: import.meta.env.PROD ? '/api' : 'http://localhost:5000/api',
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => API.post('/auth/register', data);
export const loginUser = (data) => API.post('/auth/login', data);
export const getMe = () => API.get('/auth/me');

// Tasks
export const getTasks = (params) => API.get('/tasks', { params });
export const createTask = (data) => API.post('/tasks', data);
export const updateTask = (id, data) => API.put(`/tasks/${id}`, data);
export const deleteTask = (id) => API.delete(`/tasks/${id}`);
export const reduceWorkload = () => API.post('/tasks/auto-reduce');
export const getStats = () => API.get('/tasks/stats');

// Burnout
export const getBurnoutStatus = () => API.get('/burnout');

export default API;
