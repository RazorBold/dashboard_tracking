import axios, { AxiosError, AxiosInstance } from 'axios';
import { useAuthStore } from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

let refreshingToken: Promise<string> | null = null;

const doRefresh = (): Promise<string> => {
  if (!refreshingToken) {
    refreshingToken = axios
      .post(`${API_BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token: string = res.data.data.accessToken;
        localStorage.setItem('tenant_accessToken', token);
        useAuthStore.getState().setToken(token);
        return token;
      })
      .finally(() => { refreshingToken = null; });
  }
  return refreshingToken;
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !(originalRequest as any)._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      (originalRequest as any)._retry = true;
      try {
        const token = await doRefresh();
        originalRequest.headers.Authorization = `Bearer ${token}`;
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

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('tenant_accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
