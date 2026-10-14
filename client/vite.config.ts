import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3001,
    host: true,
  },
  preview: {
    port: 3001,
    host: true,
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      include: [/yoruk-game-sdk/, /node_modules/],
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: ['@yorukgames/game-sdk'],
  },
});
