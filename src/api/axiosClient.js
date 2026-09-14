import axios from 'axios';

// Instancia para el Microservicio de Catalog (Puerto 8081)
export const catalogClient = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Instancia para el Microservicio de Requests (Puerto 8082)
export const requestsClient = axios.create({
  baseURL: 'http://localhost:8082',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función auxiliar para inyectar el token Bearer en ambas instancias
export const setupAxiosInterceptors = (msalInstance) => {
  const attachTokenInterceptor = async (config) => {
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
  };

  catalogClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
  requestsClient.interceptors.request.use(attachTokenInterceptor, (error) => Promise.reject(error));
};