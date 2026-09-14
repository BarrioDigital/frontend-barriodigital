import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: '',
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