import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

// Tests unitarios y de componentes (pnpm test). Los E2E con Playwright están en _validation/.
export default defineConfig({
  // Las imágenes de public/ (p. ej. el escudo) se dejan como URL, igual que en el navegador
  plugins: [vue({ template: { transformAssetUrls: { includeAbsolute: false } } })],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    restoreMocks: true,
    // Las fechas se prueban en hora de Perú, como las usa la municipalidad
    env: { TZ: 'America/Lima' },
  },
});
