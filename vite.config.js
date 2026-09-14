import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api/report': {
        target: 'http://localhost:8085',
        changeOrigin: true,
      },

      '/api/audit': {
        target: 'http://localhost:8084',
        changeOrigin: true,
      },
    },
  },
})