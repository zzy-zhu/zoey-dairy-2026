import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://zzy-zhu.github.io/zoey-dairy-2026/
export default defineConfig({
  base: '/zoey-dairy-2026/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // The main chunk is mostly the Firebase auth + Firestore SDK (~165 kB
    // gzipped). The Anthropic SDK is loaded on demand from the Reflect tab.
    chunkSizeWarningLimit: 700,
  },
})
