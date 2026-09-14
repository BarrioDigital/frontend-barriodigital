import axios from 'axios';

// URL base provisional de AWS API Gateway (se actualiza cuando tu compañero entregue la URL final)
const API_BASE_URL = 'https://xyz.execute-api.us-east-1.amazonaws.com';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función auxiliar para inyectar el token desde MSAL
export const setupAxiosInterceptors = (msalInstance) => {
  axiosClient.interceptors.request.use(
    async (config) => {
      const activeAccount = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];

      if (activeAccount) {
        try {
          const response = await msalInstance.acquireTokenSilent({
            scopes: ["User.Read", "openid", "profile"],
            account: activeAccount,
          });
          config.headers.Authorization = `Bearer ${response.accessToken}`;
        } catch (error) {
          console.warn("No se pudo obtener el token silenciosamente, solicitando interactivo...", error);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};