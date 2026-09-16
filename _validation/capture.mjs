import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SERVERS = {
  original: 'http://localhost:5000',
  reversed: 'http://localhost:5001'
};

const VIEWPORTS = [
  { name: '1440', width: 1440, height: 900 },
  { name: '375', width: 375, height: 667 }
];

const ROUTES = [
  { name: 'home', path: '/' },
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/dashboard' }
];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  for (const [env, url] of Object.entries(SERVERS)) {
    const targetDir = path.join('_validation', 'screenshots', env);
    fs.mkdirSync(targetDir, { recursive: true });

    for (const route of ROUTES) {
      for (const vp of VIEWPORTS) {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        await page.goto(`${url}${route.path}`);
        await wait(1500); // Wait for React to render
        const fileName = `${route.name}_${vp.name}.png`;
        const filePath = path.join(targetDir, fileName);
        await page.screenshot({ path: filePath, fullPage: true });
        console.log(`Guardado ${env}: ${filePath}`);
      }
    }
  }

  await browser.close();
}

run().catch(console.error);
