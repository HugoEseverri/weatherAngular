import { defineConfig, devices } from '@playwright/test';

const PORT = 4321;
const isCI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'es-AR',
    timezoneId: 'America/Argentina/Buenos_Aires',
    trace: 'on-first-retry',
    // En local usamos Edge (ya instalado); en CI, el Chromium de Playwright
    channel: isCI ? undefined : 'msedge',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel: isCI ? undefined : 'msedge' } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel: isCI ? undefined : 'msedge' } },
  ],
  webServer: {
    // Build sin SSR: así las APIs simuladas en el navegador cubren todas las peticiones
    command: `npx ng serve --configuration e2e --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 180_000,
  },
});
