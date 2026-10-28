import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // react-countup exposes its component through a CommonJS default export.
    needsInterop: ['react-countup'],
  },
})
