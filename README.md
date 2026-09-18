# Frontend Municipal — Sistema LF ITSE

Frontend del sistema de Licencias de Funcionamiento (LF) e Inspecciones
Técnicas de Seguridad en Edificaciones (ITSE) de la Municipalidad.

## Stack

- **Vue 3** con Composition API (`<script setup>`)
- **Vite** como bundler
- **TypeScript** estricto
- **Pinia** para estado global
- **Vue Router** para navegación
- **@tanstack/vue-query** para fetching y cache
- **Tailwind CSS v4** para estilos
- **Axios** como cliente HTTP
- **Vitest** + **@vue/test-utils** para tests

## Arquitectura

Clean Architecture con las siguientes capas:

- `src/domain/` — Entidades, ports (contratos), errores de negocio. **Puro TypeScript.**
- `src/application/` — Composables (React Query + Container), DTOs, mappers, use cases.
- `src/infrastructure/` — Implementaciones de ports, Axios, Pinia store.
- `src/presentation/` — Componentes `.vue`, páginas, layouts, router, estilos.
- `src/composition/` — Composition Root (único lugar con `new XxxRepositoryImpl()`).

Ver `_docs/ARCHITECTURE.md` para el detalle completo.

## Estructura
```text
frontend-reversed-pro_vue/
├── public/                       # favicon, icons, imágenes
├── src/                          # código fuente
│   ├── application/              # composables, DTOs, mappers, use cases
│   ├── composition/              # container.ts
│   ├── domain/                   # entities, ports, exceptions
│   ├── infrastructure/           # http, repositories, store (Pinia)
│   └── presentation/             # components, pages, router, styles
├── _docs/                        # documentación oficial
├── _forensics/                   # evidencia forense (discrepancias)
├── _validation/                  # validación visual (pixelmatch)
└── scripts/                      # scripts de mantenimiento
```

## Instalación

```bash
pnpm install
```

## Desarrollo

```bash
pnpm dev          # servidor dev en http://localhost:5173
pnpm build        # build de producción
pnpm preview      # preview del build
pnpm test         # tests con Vitest
pnpm lint         # eslint
pnpm vue-tsc -b   # typecheck
```

## Variables de entorno
Crear `.env.local` basado en `.env.example`:

```text
VITE_API_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

## Despliegue en IIS
1. `pnpm build` genera `dist/`.
2. Copiar `dist/` completo a la carpeta del sitio IIS.
3. Verificar que `web.config` está presente en la raíz del sitio.
4. Verificar que la extensión URL Rewrite de IIS está instalada.
5. Verificar que MIME Types incluye `.woff2`, `.svg`, `.json`.

## Documentación adicional
- `_docs/ARCHITECTURE.md` — Arquitectura y flujo de datos.
- `_docs/ACTA_DE_CIERRE.md` — Acta formal del proyecto.
- `_forensics/` — Hallazgos forenses.
- `_validation/` — Evidencia visual (pixelmatch).
