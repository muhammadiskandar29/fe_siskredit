import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach Sanctum Bearer Token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spk_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthenticated
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('spk_token');
      localStorage.removeItem('spk_user');
    }
    return Promise.reject(error);
  }
);
