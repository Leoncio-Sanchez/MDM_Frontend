/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/http/axios.client.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import axios from 'axios';

export const httpClient = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const stateStr = localStorage.getItem('auth-storage');
  if (stateStr) {
    try {
      const state = JSON.parse(stateStr).state;
      if (state && state.accessToken) {
        config.headers.Authorization = `Bearer ${state.accessToken}`;
      }
    } catch(e) {}
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
