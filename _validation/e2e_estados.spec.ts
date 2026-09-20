import { test, expect } from '@playwright/test';

test.describe('E2E: Login + Estados contra Laravel (datos reales de Neon)', () => {
  test('login exitoso y datos reales en Estados', async ({ page }) => {
    const errors: string[] = [];

    // Capture console errors
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    // 1. Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    const usernameInput = page.locator('input').nth(0);
    const passwordInput = page.locator('input[type="password"]').first();

    await usernameInput.fill('admin');
    await passwordInput.fill('admin');
    await page.locator('button[type="submit"]').click();

    // 2. Esperar redirect al Panel Administrativo
    await page.waitForURL(/\/admin/, { timeout: 15000 });
    console.log('✅ Login exitoso — URL:', page.url());

    // 3. Screenshot del dashboard
    await page.screenshot({ path: '/tmp/e2e_dashboard.png', fullPage: true });

    // 4. Click en el link de "Estados" en el menú (para hacer navegación SPA)
    // El AppLayout debe estar mostrando los links porque ahora el usuario es ADMIN_MUNICIPALIDAD
    await page.locator('a[href="/admin/estados"]').click();
    
    // Esperar que la ruta cambie y Vue Query cargue los datos
    await page.waitForURL(/\/admin\/estados/, { timeout: 10000 });
    await page.waitForTimeout(3000);

    // 5. Screenshot de la página de Estados con datos reales
    await page.screenshot({ path: '/tmp/e2e_estados_real.png', fullPage: true });
    console.log('📸 Screenshot guardado en /tmp/e2e_estados_real.png');

    // 6. Datos reales de Neon deben estar visibles
    await expect(page.locator('text=Vigente')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Transferida')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Anulada')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Revocada')).toBeVisible({ timeout: 10000 });

    // 7. Sin mocks
    const dato1Count = await page.locator('text=Dato 1').count();
    expect(dato1Count).toBe(0);

    // 8. Sin errores de consola
    expect(errors).toEqual([]);

    console.log('✅ E2E PASSED: 4 estados reales de Neon visibles. Sin mocks. Sin errores de consola.');
  });
});
