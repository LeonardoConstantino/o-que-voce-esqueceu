import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@db': path.resolve(__dirname, './src/db'),
        '@atelier': path.resolve(__dirname, './src/atelier'),
        '@converter': path.resolve(__dirname, './src/converter'),
        '@arena': path.resolve(__dirname, './src/arena'),
        '@postarena': path.resolve(__dirname, './src/postarena'),
        '@shell': path.resolve(__dirname, './src/shell'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
