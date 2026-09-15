import axios from 'axios';

// Base URL dinámica (Proxy de Vite o API Gateway)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Instancia base genérica
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Auditoría
export const auditClient = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Catalog (Puerto 8081)
export const catalogClient = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Requests (Puerto 8082)
export const requestsClient = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:8082',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor global para inyectar Token Bearer MSAL
export const setupAxiosInterceptors = (msalInstance) => {
  const attachTokenInterceptor = async (config) => {
    const activeAccount =
      msalInstance.getActiveAccount() ||
      msalInstance.getAllAccounts()[0];

    if (activeAccount) {
      console.log('Usuario autenticado:', activeAccount.username);
      try {
        const response = await msalInstance.acquireTokenSilent({
          scopes: ["User.Read", "openid", "profile"],
          account: activeAccount,
        });
        config.headers.Authorization = `Bearer ${response.accessToken}`;
      } catch (error) {
        console.warn(
          "No se pudo obtener el token silenciosamente, solicitando interactivo...",
          error
        );
      }
    }
    return config;
  };

  // Aplicar el interceptor a TODAS las instancias
  axiosClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
  auditClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
  catalogClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
  requestsClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
};