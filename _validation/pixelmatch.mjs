import fs from 'fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const ROUTES = ['home', 'login', 'dashboard'];
const VIEWPORTS = ['1440', '375'];

console.log('| Vista | Viewport | Diferencia % | Estado |');
console.log('|---|---|---|---|');

let allPassed = true;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    const originalPath = `_validation/screenshots/original/${route}_${vp}.png`;
    const reversedPath = `_validation/screenshots/reversed/${route}_${vp}.png`;
    
    if (!fs.existsSync(originalPath) || !fs.existsSync(reversedPath)) {
      console.log(`| /${route} | ${vp} | ERROR | ❌ Faltan archivos |`);
      allPassed = false;
      continue;
    }

    const img1 = PNG.sync.read(fs.readFileSync(originalPath));
    const img2 = PNG.sync.read(fs.readFileSync(reversedPath));

    const width = Math.min(img1.width, img2.width);
    const height = Math.min(img1.height, img2.height);
    const diff = new PNG({ width, height });

    const i1 = new PNG({ width, height });
    const i2 = new PNG({ width, height });
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx1 = (img1.width * y + x) << 2;
            const idx2 = (img2.width * y + x) << 2;
            const idxDest = (width * y + x) << 2;
            
            i1.data[idxDest] = img1.data[idx1];
            i1.data[idxDest+1] = img1.data[idx1+1];
            i1.data[idxDest+2] = img1.data[idx1+2];
            i1.data[idxDest+3] = img1.data[idx1+3];
            
            i2.data[idxDest] = img2.data[idx2];
            i2.data[idxDest+1] = img2.data[idx2+1];
            i2.data[idxDest+2] = img2.data[idx2+2];
            i2.data[idxDest+3] = img2.data[idx2+3];
        }
    }

    const numDiffPixels = pixelmatch(i1.data, i2.data, diff.data, width, height, { threshold: 0.1 });
    const diffPercent = (numDiffPixels / (width * height)) * 100;
    
    const pass = diffPercent < 0.5;
    const status = pass ? '✅ PASS' : '❌ FAIL';
    if (!pass) allPassed = false;

    console.log(`| /${route === 'home' ? '' : route} | ${vp} | ${diffPercent.toFixed(2)}% | ${status} |`);
  }
}
