import axios from 'axios';

// URL de invocación de tu AWS HTTP API Gateway
const API_GATEWAY_URL = import.meta.env.VITE_API_BASE_URL || 'https://jrob2doi1b.execute-api.us-east-1.amazonaws.com';

// Instancias base
export const axiosClient = axios.create({ baseURL: API_GATEWAY_URL, headers: { 'Content-Type': 'application/json' } });
export const auditClient = axios.create({ baseURL: API_GATEWAY_URL, headers: { 'Content-Type': 'application/json' } });
export const catalogClient = axios.create({ baseURL: API_GATEWAY_URL, headers: { 'Content-Type': 'application/json' } });
export const requestsClient = axios.create({ baseURL: API_GATEWAY_URL, headers: { 'Content-Type': 'application/json' } });
export const reportClient = axios.create({ baseURL: API_GATEWAY_URL, headers: { 'Content-Type': 'application/json' } });

// Ámbito (scope) personalizado de la API expuesta en Azure Entra ID
const API_SCOPE = ["api://95f77a04-372f-4892-ac61-3645256190af/access_as_user"];

// Interceptor global para inyectar Token Bearer MSAL
export const setupAxiosInterceptors = (msalInstance) => {
  const attachTokenInterceptor = async (config) => {
    const activeAccount =
      msalInstance.getActiveAccount() ||
      msalInstance.getAllAccounts()[0];

    if (activeAccount) {
      try {
        // Solicitamos el token con el scope explícito de tu API
        const response = await msalInstance.acquireTokenSilent({
          scopes: API_SCOPE,
          account: activeAccount,
        });

        config.headers.Authorization = `Bearer ${response.accessToken}`;
      } catch (error) {
        console.warn("Error obteniendo token silenciosamente, solicitando token interactivo...", error);
        try {
          // Si falla la obtención silenciosa, solicita token mediante emergente
          const response = await msalInstance.acquireTokenPopup({
            scopes: API_SCOPE,
            account: activeAccount,
          });
          config.headers.Authorization = `Bearer ${response.accessToken}`;
        } catch (popupError) {
          console.error("Error en autenticación interactiva:", popupError);
        }
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