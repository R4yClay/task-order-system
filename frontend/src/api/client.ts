import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api' });

export const tokens = {
  get access() { return localStorage.getItem('access_token'); },
  get refresh() { return localStorage.getItem('refresh_token'); },
  save(access: string, refresh: string) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  },
  clear() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

api.interceptors.request.use(config => {
  if (tokens.access) config.headers.Authorization = `Bearer ${tokens.access}`;
  config.headers['Accept-Language'] = localStorage.getItem('taskflow_lang') || 'en';
  return config;
});

// Access tokens live 30 minutes: renew silently with the refresh token instead of logging out.
let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  if (!tokens.refresh) return false;
  try {
    const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, null, {
      params: { refresh_token: tokens.refresh },
    });
    tokens.save(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
  if (error.response?.status === 401 && original && !original._retried && !original.url?.includes('/auth/')) {
    original._retried = true;
    refreshing ??= refreshTokens().finally(() => { refreshing = null; });
    if (await refreshing) return api(original);
    tokens.clear();
    window.location.reload();
  }
  return Promise.reject(error);
});

export function errorText(error: unknown, fallback: string): string {
  const detail = (error as AxiosError<{ detail?: unknown }>)?.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
}
