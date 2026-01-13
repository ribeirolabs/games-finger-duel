import { defineConfig } from 'vite';

export default defineConfig({
  base: '/games-finger-duel/',
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
