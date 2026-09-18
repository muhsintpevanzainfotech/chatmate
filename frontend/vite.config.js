import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 7001,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:7000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Backend server unavailable' }));
            }
          });
        },
      },
      '/socket.io': {
        target: 'http://127.0.0.1:7000',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(502);
              res.end();
            }
          });
          proxy.on('proxyReqWs', (proxyReq, req, socket) => {
            if (socket) {
              socket.on('error', () => {});
            }
          });
          proxy.on('open', (proxySocket) => {
            if (proxySocket) {
              proxySocket.on('error', () => {});
            }
          });
        },
      },
    },
  },
});



