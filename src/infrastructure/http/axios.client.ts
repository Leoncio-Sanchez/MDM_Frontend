import axios from 'axios';

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8001/api',
  timeout: Number(import.meta.env.VITE_HTTP_TIMEOUT) || 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const stateStr = localStorage.getItem('auth-storage');
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr);
      if (state && state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    } catch(e) {}
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y la solicitud no es de autenticación
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Endpoints públicos (consulta, cuenta del ciudadano): un 401 es "contraseña incorrecta",
      // no una sesión vencida; el error llega tal cual al formulario
      if (originalRequest.url?.includes('/publico/')) {
        return Promise.reject(error);
      }

      const isAuthEndpoint = originalRequest.url?.includes('/auth/jwt/create/') ||
                             originalRequest.url?.includes('/auth/jwt/refresh/');

      if (isAuthEndpoint) {
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('auth-refresh-token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('auth-refresh-token');
      if (!refreshToken) {
        localStorage.removeItem('auth-storage');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return httpClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshUrl = `${httpClient.defaults.baseURL}/auth/jwt/refresh/`;
        const { data } = await axios.post(refreshUrl, { refresh: refreshToken });

        const newAccessToken = data.access;
        const newRefreshToken = data.refresh;

        if (newRefreshToken) {
          localStorage.setItem('auth-refresh-token', newRefreshToken);
        }

        const stateStr = localStorage.getItem('auth-storage');
        if (stateStr) {
          try {
            const state = JSON.parse(stateStr);
            state.token = newAccessToken;
            localStorage.setItem('auth-storage', JSON.stringify(state));
          } catch (e) {}
        }

        httpClient.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return httpClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('auth-refresh-token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
