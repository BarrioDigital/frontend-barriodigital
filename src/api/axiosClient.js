import axios from 'axios';

// URL de invocación de tu AWS HTTP API Gateway
const API_GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || 'https://jrob2doi1b.execute-api.us-east-1.amazonaws.com';

// Instancia base genérica
export const axiosClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Auditoría
export const auditClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Catálogo
export const catalogClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Solicitudes (Requests)
export const requestsClient = axios.create({
  baseURL: API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Reportes / KPIs
export const reportClient = axios.create({
  baseURL: API_GATEWAY_URL,
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