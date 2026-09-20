import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './_validation',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  // Playwright levanta y baja automáticamente el servidor de desarrollo
  webServer: {
    command: 'pnpm exec vite --host 0.0.0.0 --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
});
