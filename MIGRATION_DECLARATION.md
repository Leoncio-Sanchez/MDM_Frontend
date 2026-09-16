# Declaración de Migración React → Vue

## Motivo
La instrucción original del Stakeholder fue "que todo sea en vui.dj" (Vue.js).
El proyecto anterior fue construido en React. Esta migración corrige esa discrepancia.

## Alcance
- Re-implementación completa en Vue 3 + Vite + TypeScript.
- Preservación de Clean Architecture.
- Preservación del diseño visual (pixelmatch < 0.5%).
- Preservación de recursos binarios (hashes idénticos).

## Lo que NO se preserva
- Código React (se reescribe).
- Componentes TSX (se reescriben en .vue).
- Hooks React (se reescriben como composables Vue).
- Zustand (se reescribe con Pinia).
