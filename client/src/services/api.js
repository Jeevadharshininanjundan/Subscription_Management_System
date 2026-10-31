import axios from 'axios';

export const authStorageKey = 'brightloop.accessToken';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = window.localStorage.getItem(authStorageKey);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message || 'Something went wrong. Please try again.';
}
