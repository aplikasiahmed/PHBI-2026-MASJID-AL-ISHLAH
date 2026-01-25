import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Meningkatkan batas peringatan ukuran file menjadi 2000kb (2MB)
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Memecah library besar menjadi file terpisah agar tidak menumpuk di satu file utama
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            return 'vendor'; // Library lainnya masuk ke vendor.js
          }
        },
      },
    },
  },
})
