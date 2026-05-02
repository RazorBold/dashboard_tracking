import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Singleton refresh promise — prevents concurrent 401s from each triggering a separate refresh call
let refreshingToken: Promise<string> | null = null;

const doRefresh = (): Promise<string> => {
  if (!refreshingToken) {
    refreshingToken = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token: string = res.data.data.accessToken;
        localStorage.setItem('accessToken', token);
        useAuthStore.getState().setToken(token);
        return token;
      })
      .finally(() => {
        refreshingToken = null;
      });
  }
  return refreshingToken;
};

// Response interceptor: on 401 try refresh once, then retry the original request
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry
    ) {
      if (
        originalRequest.url?.includes('/auth/login') ||
        originalRequest.url?.includes('/auth/refresh')
      ) {
        return Promise.reject(error);
      }

      (originalRequest as any)._retry = true;

      try {
        const accessToken = await doRefresh();
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosClient(originalRequest);
      } catch {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// Request interceptor: attach Bearer token from localStorage
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
