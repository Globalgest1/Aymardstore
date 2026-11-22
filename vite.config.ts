import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  define: {
    'process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '1069749520606-9bgh641esn3qhmtnqph8f2knmc2168h5.apps.googleusercontent.com'),
    'process.env.NEXT_PUBLIC_LEEKPAY_PUBLIC_KEY': JSON.stringify(process.env.NEXT_PUBLIC_LEEKPAY_PUBLIC_KEY || ''),
    'process.env': {},
  },
  plugins: [
    laravel({
      input: ['resources/css/app.css', 'resources/js/app.tsx'],
      refresh: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'resources/js'),
      '@data': path.resolve(import.meta.dirname, 'data'),
    },
  },
});
