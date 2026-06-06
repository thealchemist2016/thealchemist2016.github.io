import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'docs',
    emptyOutDir: true
  },
  server: {
    proxy: {
      '/users': 'http://localhost:3001',
      '/albums': 'http://localhost:3001',
      '/tracks': 'http://localhost:3001',
      '/notifications': 'http://localhost:3001',
      '/tickets': 'http://localhost:3001',
      '/withdrawals': 'http://localhost:3001',
      '/admin': 'http://localhost:3001',
    }
  }
})

