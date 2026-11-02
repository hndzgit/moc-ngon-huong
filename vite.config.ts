import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [
    react(),
    {
      name: 'api-orders-dev',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url && req.url.startsWith('/api/me/orders')) {
            try {
              const { default: handler } = await server.ssrLoadModule('/api/me/orders.ts');
              await handler(req, res);
            } catch (err: any) {
              console.error('[API Middleware Error /api/me/orders]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
            }
          } else if (req.url && req.url.startsWith('/api/orders')) {
            try {
              const { default: handler } = await server.ssrLoadModule('/api/orders.ts');
              await handler(req, res);
            } catch (err: any) {
              console.error('[API Middleware Error /api/orders]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
            }
          } else {
            next();
          }
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth'],
        },
      },
    },
  },
});
