import axios from 'axios';

// IP Pública de servidor AWS EC2 con protocolo HTTP incluido
const EC2_PUBLIC_IP = 'http://54.196.124.236';

// Base URL dinámica (Proxy de Vite, Variable de Entorno o IP Pública de EC2)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Instancia base genérica
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Auditoría (Puerto 8084)
export const auditClient = axios.create({
  baseURL: API_BASE_URL || `${EC2_PUBLIC_IP}:8084`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Catalog (Puerto 8081)
export const catalogClient = axios.create({
  baseURL: API_BASE_URL || `${EC2_PUBLIC_IP}:8081`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Requests (Puerto 8082)
export const requestsClient = axios.create({
  baseURL: API_BASE_URL || `${EC2_PUBLIC_IP}:8082`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Reportes / KPIs (Puerto 8085)
export const reportClient = axios.create({
  baseURL: API_BASE_URL || `${EC2_PUBLIC_IP}:8085`,
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
  reportClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
};