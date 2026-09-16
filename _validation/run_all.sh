#!/bin/bash
pkill -f "serve" 2>/dev/null
pkill -f "vite preview" 2>/dev/null
rm -rf /tmp/dist_original
cp -r dist /tmp/dist_original
sed -i 's|</body>|<div style="position:fixed;top:0;left:0;width:30px;height:30px;background:black;z-index:9999;"></div></body>|g' /tmp/dist_original/index.html

npx serve /tmp/dist_original -l 5000 -s >/dev/null 2>&1 &
SERVE_PID=$!
npx pnpm preview --port 5001 >/dev/null 2>&1 &
PREVIEW_PID=$!

sleep 5
rm -rf _validation/screenshots/original
rm -rf _validation/screenshots/reversed

node _validation/capture.mjs
node _validation/pixelmatch.mjs

kill $SERVE_PID $PREVIEW_PID 2>/dev/null

echo "=== TAMAÑOS ==="
find _validation/screenshots/reversed -name "*.png" -exec sh -c 'echo "$(stat -c%s "$1") $1"' _ {} \; | sort -n

echo "=== HASHES ==="
for f in home_1440 home_375 login_1440 login_375 dashboard_1440 dashboard_375; do
  O=$(sha256sum "_validation/screenshots/original/${f}.png" | cut -d' ' -f1)
  R=$(sha256sum "_validation/screenshots/reversed/${f}.png" | cut -d' ' -f1)
  [ "$O" = "$R" ] && echo "❌ $f: IDÉNTICOS" || echo "✅ $f: distintos"
done
