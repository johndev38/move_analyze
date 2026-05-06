import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    // Requis pour accéder via un domaine ngrok (host header externe).
    allowedHosts: true,
  },
});
