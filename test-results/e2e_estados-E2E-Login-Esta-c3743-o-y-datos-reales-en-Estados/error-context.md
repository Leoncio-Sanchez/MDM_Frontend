# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e_estados.spec.ts >> E2E: Login + Estados contra Laravel (datos reales de Neon) >> login exitoso y datos reales en Estados
- Location: _validation/e2e_estados.spec.ts:4:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img "Sistema LF ITSE" [ref=e6]
    - heading "Sistema LF ITSE" [level=2] [ref=e7]
  - generic [ref=e8]:
    - heading "Iniciar Sesión" [level=2] [ref=e10]
    - generic [ref=e11]: Network Error
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Usuario
        - textbox "Ingrese su usuario" [ref=e15]: inspector1
      - generic [ref=e16]:
        - generic [ref=e17]: Contraseña
        - textbox "Ingrese su contraseña" [ref=e18]: inspector123
      - button "Ingresar" [ref=e19]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('E2E: Login + Estados contra Laravel (datos reales de Neon)', () => {
  4  |   test('login exitoso y datos reales en Estados', async ({ page }) => {
  5  |     const errors: string[] = [];
  6  | 
  7  |     // Capture console errors
  8  |     page.on('console', (m) => {
  9  |       if (m.type() === 'error') errors.push(m.text());
  10 |     });
  11 | 
  12 |     // 1. Login
  13 |     await page.goto('/login');
  14 |     await page.waitForLoadState('networkidle');
  15 | 
  16 |     const usernameInput = page.locator('input').nth(0);
  17 |     const passwordInput = page.locator('input[type="password"]').first();
  18 | 
  19 |     await usernameInput.fill('inspector1');
  20 |     await passwordInput.fill('inspector123');
  21 |     await page.locator('button[type="submit"]').click();
  22 | 
  23 |     // 2. Esperar redirect al Panel Administrativo
> 24 |     await page.waitForURL(/\/admin/, { timeout: 15000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  25 |     console.log('✅ Login exitoso — URL:', page.url());
  26 | 
  27 |     // 3. Screenshot del dashboard
  28 |     await page.screenshot({ path: '/tmp/e2e_dashboard.png', fullPage: true });
  29 | 
  30 |     // 4. Click en el link de "Estados" en el menú (para hacer navegación SPA)
  31 |     // El AppLayout debe estar mostrando los links porque ahora el usuario es ADMIN_MUNICIPALIDAD
  32 |     await page.locator('a[href="/admin/estados"]').click();
  33 |     
  34 |     // Esperar que la ruta cambie y Vue Query cargue los datos
  35 |     await page.waitForURL(/\/admin\/estados/, { timeout: 10000 });
  36 |     await page.waitForTimeout(3000);
  37 | 
  38 |     // 5. Screenshot de la página de Estados con datos reales
  39 |     await page.screenshot({ path: '/tmp/e2e_estados_real.png', fullPage: true });
  40 |     console.log('📸 Screenshot guardado en /tmp/e2e_estados_real.png');
  41 | 
  42 |     // 6. Datos reales de Neon deben estar visibles
  43 |     await expect(page.locator('text=Vigente')).toBeVisible({ timeout: 10000 });
  44 |     await expect(page.locator('text=Transferida')).toBeVisible({ timeout: 10000 });
  45 |     await expect(page.locator('text=Anulada')).toBeVisible({ timeout: 10000 });
  46 |     await expect(page.locator('text=Revocada')).toBeVisible({ timeout: 10000 });
  47 | 
  48 |     // 7. Sin mocks
  49 |     const dato1Count = await page.locator('text=Dato 1').count();
  50 |     expect(dato1Count).toBe(0);
  51 | 
  52 |     // 8. Sin errores de consola
  53 |     expect(errors).toEqual([]);
  54 | 
  55 |     console.log('✅ E2E PASSED: 4 estados reales de Neon visibles. Sin mocks. Sin errores de consola.');
  56 |   });
  57 | });
  58 | 
```