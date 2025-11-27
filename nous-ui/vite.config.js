import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Memaksa Vite mengenali lokasi modul blockchain dengan benar
      '@mysten/dapp-kit': path.resolve(__dirname, 'node_modules/@mysten/dapp-kit'),
      '@mysten/sui.js': path.resolve(__dirname, 'node_modules/@mysten/sui.js'),
    },
  },
  server: {
    fs: {
      // Mengizinkan akses file di luar root jika diperlukan
      allow: ['..'],
    },
  },
})