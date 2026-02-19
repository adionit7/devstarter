import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Interview tip: The proxy rewrites /api/* calls to the backend container.
// This means the frontend never has to know the backend's URL — clean separation.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
      },
    },
  },
})
