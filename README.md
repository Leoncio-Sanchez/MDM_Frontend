# Frontend — Sistema LF-ITSE

Interfaz web del sistema de **Licencias de Funcionamiento (LF)** e **Inspecciones Técnicas de Seguridad en
Edificaciones (ITSE)** de la Municipalidad Distrital de Morales. Consume la API de
[MDM_BACKEND](https://github.com/Leoncio-Sanchez/MDM_BACKEND).

Tiene cuatro entradas, una por tipo de usuario:

| Quién | Entra por | Ve |
|---|---|---|
| Personal de oficina | `/login` | Panel `/admin`, con las pantallas que permiten sus casillas de acceso |
| Inspector de campo | `/login` | Bandeja `/inspector` y registro del acta (pensado para celular) |
| Ciudadano | `/ciudadano/ingresar` | "Mis trámites" `/ciudadano` |
| Cualquiera | `/consulta` | Consulta de un trámite con su número y el DNI o RUC |

El detalle por perfil está en [`_docs/MANUAL_DE_USO.md`](_docs/MANUAL_DE_USO.md) y en
`_docs/PERFILES_Y_ACCESOS.md` del backend.

## Stack

| Pieza | Versión |
|---|---|
| Vue (Composition API, `<script setup>`) | 3.5 |
| TypeScript | 6 (estricto) |
| Vite | 8 |
| Tailwind CSS | 4 (modo oscuro por clase `.dark`) |
| Pinia | sesión, tema y notificaciones |
| @tanstack/vue-query | caché de datos del servidor |
| Axios | cliente HTTP con renovación automática del token |
| Vitest + @vue/test-utils + jsdom | tests |

## Puesta en marcha

Requiere Node 22 y pnpm 11 (las versiones del CI), y el backend corriendo (por defecto en `http://localhost:8001`).

```bash
pnpm install
cp .env.example .env.local   # ajustar VITE_API_URL si el backend está en otra dirección
pnpm dev                  # http://localhost:5173
```

| Comando | Para qué |
|---|---|
| `pnpm dev` | Servidor de desarrollo con recarga en caliente |
| `pnpm build` | Verifica tipos (`vue-tsc`) y genera `dist/` |
| `pnpm preview` | Sirve el build de `dist/` |
| `pnpm test` | Corre los tests una vez |
| `pnpm test:watch` | Tests en modo observador |

### Variables de entorno

| Variable | Por defecto | Para qué |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8001/api` | URL base de la API |
| `VITE_HTTP_TIMEOUT` | `15000` | Espera máxima por pedido, en ms |

Se leen al compilar: cambiarlas exige volver a correr `pnpm build`. Los valores propios van en `.env.local`,
que Git ignora.

### Usuarios para probar

El backend crea un usuario por perfil con `php artisan usuarios:prueba` (`prueba_mesa`, `prueba_licencias`,
`prueba_itse`, `prueba_jefe_itse`, `prueba_inspector1`, `prueba_inspector2`, `prueba_admin`, `prueba_auditor`).
La contraseña la genera el comando; no se guarda en el repositorio.

## Estructura

```text
src/
├── domain/           entidades, ports (contratos de los repositorios) y errores. TypeScript puro
├── application/      composables con vue-query, DTOs, mappers y casos de uso
├── infrastructure/   cliente HTTP, implementación de los repositorios y stores de Pinia
├── composition/      container.ts: el único lugar donde se instancian los repositorios
└── presentation/     páginas, componentes (atoms, molecules, organisms, templates), router y utilidades
```

Cómo se conectan las capas, el manejo de la sesión, los permisos y las convenciones de código:
[`_docs/ARQUITECTURA.md`](_docs/ARQUITECTURA.md).

## Tests

```bash
pnpm test
```

Cubren las reglas que más importan: qué ve cada perfil en el menú y a dónde lo lleva el router
(`router/permisos.spec.ts`), la renovación del token, el contrato con la API, los borradores de formularios, las
fechas en hora de Lima y los componentes de inspección, denegatoria y "Mis trámites". Los tests corren con
`TZ=America/Lima` (ver `vitest.config.ts`).

## Integración continua

`.github/workflows/ci.yml` corre en cada push y PR: `pnpm install --frozen-lockfile`, `pnpm test` y `pnpm build`.

## Despliegue

`pnpm build` genera `dist/`, una aplicación estática. El servidor web debe:

- Servir `index.html` para cualquier ruta que no sea un archivo (las rutas son del lado del cliente).
- Publicar la API del backend en la dirección configurada en `VITE_API_URL`, con HTTPS.

El despliegue en el VPS (Docker con Nginx y certificado HTTPS) está preparado en el backend y se hará cuando el
servidor esté disponible.

## Documentación

| Documento | Contenido |
|---|---|
| [`_docs/MANUAL_DE_USO.md`](_docs/MANUAL_DE_USO.md) | Paso a paso de cada perfil |
| [`_docs/ARQUITECTURA.md`](_docs/ARQUITECTURA.md) | Capas, sesión, permisos y convenciones |
| [`_docs/CHECKLIST_PENDIENTES.md`](_docs/CHECKLIST_PENDIENTES.md) | Revisión del 12/10/2026 (histórico) |
| [`_docs/ACTA_DE_CIERRE.md`](_docs/ACTA_DE_CIERRE.md) | Acta de cierre del frontend del 18/09/2026 (histórico) |
| `_forensics/`, `_validation/` | Evidencia de la reconstrucción del bundle original (histórico) |
