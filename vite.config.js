import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/audit': {
        target: 'http://localhost:8080', // Puerto donde corre Auditoría
        changeOrigin: true,
      },
      '/api/report': {
        target: 'http://localhost:8080', // Puerto donde corre Reportes/Dashboard
        changeOrigin: true,
      },
      '/api/catalog': {
        target: 'http://localhost:8081', // Puerto del microservicio Catálogo
        changeOrigin: true,
      },
      '/api/requests': {
        target: 'http://localhost:8082', // Puerto del microservicio Solicitudes
        changeOrigin: true,
      },
    },
  },
});