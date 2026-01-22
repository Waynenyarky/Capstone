/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Backend Port Configuration
 * 
 * This configuration supports TWO deployment modes:
 * 
 * 1. MICROSERVICES MODE (Docker Compose - default):
 *    - Auth Service: port 3001
 *    - Business Service: port 3002
 *    - Admin Service: port 3003
 *    - Audit Service: port 3004
 *    This is what start.ps1 uses when running with Docker
 * 
 * 2. UNIFIED BACKEND MODE (Local development):
 *    - All services on port 3000 (backend/src/index.js)
 *    - Use when running backend locally without Docker
 * 
 * Configuration:
 * - Set VITE_USE_MICROSERVICES=true to use microservices (ports 3001-3004)
 * - Set VITE_USE_MICROSERVICES=false or unset to use unified backend (port 3000)
 * - Or set VITE_BACKEND_PORT to override the unified backend port
 * 
 * Example .env.local:
 *   VITE_USE_MICROSERVICES=true    # Use Docker microservices
 *   # OR
 *   VITE_BACKEND_PORT=3000         # Use unified backend on port 3000
 */
// Default to microservices mode (Docker Compose) since that's what start.ps1 uses
// Set VITE_USE_MICROSERVICES=false to use unified backend (port 3000)
const USE_MICROSERVICES = process.env.VITE_USE_MICROSERVICES !== 'false' && 
                          process.env.VITE_USE_MICROSERVICES !== '0';

// Storybook/Vitest browser project is opt-in to avoid Playwright download errors.
// Enable with VITEST_STORYBOOK=true when you have Playwright browsers installed.
const ENABLE_STORYBOOK_TESTS = process.env.VITEST_STORYBOOK === 'true';

// Microservices configuration (Docker Compose setup)
const MICROSERVICES = {
  auth: Number(process.env.VITE_AUTH_PORT) || 3001,
  business: Number(process.env.VITE_BUSINESS_PORT) || 3002,
  admin: Number(process.env.VITE_ADMIN_PORT) || 3003,
  audit: Number(process.env.VITE_AUDIT_PORT) || 3004,
};

// Unified backend configuration (local development)
const UNIFIED_BACKEND_PORT = Number(process.env.VITE_BACKEND_PORT) || 3000;
const UNIFIED_BACKEND_TARGET = `http://localhost:${UNIFIED_BACKEND_PORT}`;

if (USE_MICROSERVICES) {
  console.log(`[Vite Config] Using MICROSERVICES mode (Docker Compose)`);
  console.log(`[Vite Config] Auth: ${MICROSERVICES.auth}, Business: ${MICROSERVICES.business}, Admin: ${MICROSERVICES.admin}, Audit: ${MICROSERVICES.audit}`);
} else {
  console.log(`[Vite Config] Using UNIFIED BACKEND mode (Local)`);
  console.log(`[Vite Config] Backend target: ${UNIFIED_BACKEND_TARGET}`);
}

// Helper function to create proxy config with error handling
function createProxyConfig(path, target, customConfig = {}) {
  return {
    target: target,
    changeOrigin: true,
    secure: false,
    ws: true,
    ...customConfig,
    configure: (proxy, _options) => {
      console.log(`[Proxy] ${path} -> ${target}`);
      
      proxy.on('error', (err, req, res) => {
        console.error(`[Proxy Error] ${path} to ${target}:`, err.message);
        if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
          console.warn(`[Proxy] Connection failed to ${target}`);
          if (USE_MICROSERVICES) {
            console.warn(`[Proxy] Make sure Docker services are running: docker-compose up -d`);
          } else {
            console.warn(`[Proxy] Make sure backend is running on port ${UNIFIED_BACKEND_PORT}`);
            console.warn(`[Proxy] Or set VITE_USE_MICROSERVICES=true to use Docker microservices`);
          }
        }
        if (res && !res.headersSent) {
          res.writeHead(502, {
            'Content-Type': 'text/plain',
          });
          res.end('Bad Gateway: Backend server not available');
        }
      });
      
      proxy.on('proxyReq', (proxyReq, req, _res) => {
        console.log(`[Proxy Request] ${req.method} ${req.url} -> ${target}${req.url}`);
      });
      
      proxy.on('proxyRes', (proxyRes, req, _res) => {
        console.log(`[Proxy Response] ${proxyRes.statusCode} ${req.url}`);
      });
      
      if (customConfig.configure) {
        customConfig.configure(proxy, _options);
      }
    },
  };
}

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const vitestProjects = [
  {
    test: {
      name: 'unit',
      environment: 'jsdom',
      setupFiles: ['src/test.setup.js'],
      globals: true,
      include: [
        'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
        'src/**/__tests__/**/*.{js,jsx,ts,tsx}'
      ],
      exclude: [
        'src/**/*.stories.@(js|jsx|ts|tsx)',
        'src/**/*.mdx'
      ],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: './coverage',
        thresholds: {
          lines: 60,
          statements: 60,
          branches: 50,
          functions: 55
        }
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  }
];

if (ENABLE_STORYBOOK_TESTS) {
  vitestProjects.push({
    extends: true,
    plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(__dirname, '.storybook')
      })
    ],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({}),
        instances: [{
          browser: 'chromium'
        }]
      },
      setupFiles: ['.storybook/vitest.setup.js']
    }
  });
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    projects: vitestProjects
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (required for mobile device access)
    port: 5173,
    proxy: USE_MICROSERVICES ? {
      // MICROSERVICES MODE: Route to specific service ports
      
      // Auth endpoints -> Auth Service (port 3001)
      '/api/auth': createProxyConfig('/api/auth', `http://localhost:${MICROSERVICES.auth}`),
      
      // Business endpoints -> Business Service (port 3002)
      '/api/business': createProxyConfig('/api/business', `http://localhost:${MICROSERVICES.business}`),
      
      // Admin endpoints -> Admin Service (port 3003)
      '/api/admin': createProxyConfig('/api/admin', `http://localhost:${MICROSERVICES.admin}`),
      
      // Audit endpoints -> Audit Service (port 3004)
      '/api/audit': createProxyConfig('/api/audit', `http://localhost:${MICROSERVICES.audit}`),
      
      // Maintenance endpoints -> Admin Service (port 3003)
      '/api/maintenance': createProxyConfig('/api/maintenance', `http://localhost:${MICROSERVICES.admin}`),
      
      // LGU Officer endpoints -> Admin Service (port 3003) since permit applications are admin functions
      '/api/lgu-officer': createProxyConfig('/api/lgu-officer', `http://localhost:${MICROSERVICES.admin}`),
      
      // Uploads -> Business Service (port 3002)
      '/uploads': createProxyConfig('/uploads', `http://localhost:${MICROSERVICES.business}`),
      
      // Catch-all for other API routes -> Auth Service (port 3001)
      '/api': createProxyConfig('/api', `http://localhost:${MICROSERVICES.auth}`)
    } : {
      // UNIFIED BACKEND MODE: All routes to single backend (port 3000)
      
      // All API endpoints -> Unified Backend (port 3000)
      '/api/auth': createProxyConfig('/api/auth', UNIFIED_BACKEND_TARGET),
      '/api/business': createProxyConfig('/api/business', UNIFIED_BACKEND_TARGET),
      '/api/admin': createProxyConfig('/api/admin', UNIFIED_BACKEND_TARGET),
      '/api/audit': createProxyConfig('/api/audit', UNIFIED_BACKEND_TARGET),
      '/api/maintenance': createProxyConfig('/api/maintenance', UNIFIED_BACKEND_TARGET),
      '/api/lgu-officer': createProxyConfig('/api/lgu-officer', UNIFIED_BACKEND_TARGET),
      '/uploads': createProxyConfig('/uploads', UNIFIED_BACKEND_TARGET),
      '/api': createProxyConfig('/api', UNIFIED_BACKEND_TARGET)
    }
  }
});
