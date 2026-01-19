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

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    projects: [
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
      },
      {
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
      }
    ]
  },
  server: {
    host: '0.0.0.0', // Listen on all network interfaces (required for mobile device access)
    port: 5173,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/api/business': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api/admin': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api/audit': {
        target: 'http://localhost:3004',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api/maintenance': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/uploads': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
