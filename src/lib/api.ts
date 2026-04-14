import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL =
  (typeof window === 'undefined' ? process.env.API_URL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:4000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const url = config.url ?? '';
      // Admin routes use admin token; all others use customer token
      const isAdminRoute = url.startsWith('/admin') || url.startsWith('/auth');

      if (isAdminRoute) {
        try {
          const { state } = JSON.parse(localStorage.getItem('auth-storage') ?? '{}');
          if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
        } catch { /* ignore */ }
      } else {
        try {
          const { state } = JSON.parse(localStorage.getItem('customer-auth-storage') ?? '{}');
          if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
        } catch { /* ignore */ }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path.startsWith('/admin') && !path.includes('/admin/login')) {
          localStorage.removeItem('auth-storage');
          window.location.href = '/admin/login';
        } else if (path.startsWith('/dashboard')) {
          localStorage.removeItem('customer-auth-storage');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// SWR fetcher using axios
export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get(url);
  return response.data.data;
};

export const responseFetcher = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

export default api;
