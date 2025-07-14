import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Force HTTP protocol for development
    https: false,
    port: 5173,
    // Enable SPA fallback for development
    historyApiFallback: true
  },
  build: {
    // Ensure proper asset handling for deployment
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  base: '/', // Use absolute paths for deployment
  preview: {
    // Enable SPA fallback for preview mode
    historyApiFallback: true
  }
})