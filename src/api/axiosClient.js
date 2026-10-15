import axios from 'axios';

// Instancia base genérica
export const axiosClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Auditoría
export const auditClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Catalog
export const catalogClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para Microservicio de Requests
export const requestsClient = axios.create({
  baseURL: '',
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