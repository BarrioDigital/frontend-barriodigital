import axios from 'axios';

// Si no existe VITE_API_BASE_URL, trabaja localmente usando el proxy de Vite.
// Cuando tengan API Gateway, solo se configura esa variable.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setupAxiosInterceptors = (msalInstance) => {
  axiosClient.interceptors.request.use(
    async (config) => {
      const activeAccount =
        msalInstance.getActiveAccount() ||
        msalInstance.getAllAccounts()[0];

      if (activeAccount) {
        console.log('Usuario autenticado:', activeAccount.username);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );
};