import axios from 'axios';

// Obtención dinámica del protocolo (http: / https:) y host (localhost / IP pública / DuckDNS)
const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

// Base URL dinámica configurable por VITE_API_BASE_URL o por defecto
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Instancia base genérica
export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Auditoría (Puerto 8080)
export const auditClient = axios.create({
  baseURL: API_BASE_URL || `${currentProtocol}//${currentHostname}:8080`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Catalog (Puerto 8081)
export const catalogClient = axios.create({
  baseURL: API_BASE_URL || `${currentProtocol}//${currentHostname}:8081`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Requests (Puerto 8082)
export const requestsClient = axios.create({
  baseURL: API_BASE_URL || `${currentProtocol}//${currentHostname}:8082`,
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