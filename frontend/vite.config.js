import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const targetBackend = env.VITE_API_URL || 'https://chatmate-7we0.onrender.com';

  return {
    plugins: [react()],
    server: {
      port: 7001,
      host: true,
      allowedHosts: true, // Allow all hosts including *.onrender.com
      proxy: {
        '/api': {
          target: targetBackend,
          changeOrigin: true,
          secure: false,
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
          target: targetBackend,
          ws: true,
          changeOrigin: true,
          secure: false,
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
    preview: {
      port: 7001,
      host: true,
      allowedHosts: true,
    },
  };
});
