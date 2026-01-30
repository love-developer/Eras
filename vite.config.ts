import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: 'vaul', replacement: 'vaul' },
      { find: 'sonner', replacement: 'sonner' },
      { find: 'resend', replacement: 'resend' },
      { find: 'recharts', replacement: 'recharts' },
      { find: 'react-resizable-panels', replacement: 'react-resizable-panels' },
      { find: 'react-hook-form', replacement: 'react-hook-form' },
      { find: 'react-easy-crop', replacement: 'react-easy-crop' },
      { find: 'react-day-picker', replacement: 'react-day-picker' },
      { find: 'next-themes', replacement: 'next-themes' },
      { find: 'lucide-react', replacement: 'lucide-react' },
      { find: 'input-otp', replacement: 'input-otp' },
      { find: 'embla-carousel-react', replacement: 'embla-carousel-react' },
      { find: 'date-fns', replacement: 'date-fns' },
      { find: 'cmdk', replacement: 'cmdk' },
      { find: 'class-variance-authority', replacement: 'class-variance-authority' },
      { find: /^@radix-ui\/(.*)/, replacement: '@radix-ui/$1' },
      { find: '@jsr/supabase__supabase-js', replacement: '@jsr/supabase__supabase-js' },
    ],
  },
  build: {
    rollupOptions: {
      external: ['sonner'],
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});