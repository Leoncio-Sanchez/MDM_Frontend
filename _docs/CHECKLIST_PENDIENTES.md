# ✅ Checklist de pendientes — Frontend MDM

**Fecha de revisión:** 2026-10-12
**Contra:** backend Laravel (`MDM_BACKEND`, 115 rutas en `/api`)
**Método:** lectura del código de `src/`, `vue-tsc -b`, y llamadas reales a la API local con las URLs exactas que usa cada repositorio.

> Leyenda: 🔴 bloquea el uso real · 🟠 funcionalidad incompleta · 🟡 calidad / deuda

---

## 1. Build y calidad

- [ ] 🔴 **`pnpm build` falla**: `vue-tsc` reporta `AppHeader.vue(42,7): 'currentInfo' is declared but its value is never read` (TS6133). El ACTA de cierre dice "0 errores", ya no es cierto.
- [ ] 🟡 **0 tests unitarios** en `src/` (Vitest está instalado pero no hay ningún `*.spec.ts` / `*.test.ts`). Solo existe 1 test E2E en `_validation/` (Estados).
- [ ] 🟡 Quitar los comentarios `// TODO(MIGRATION): Este repositorio apunta a Django (8000)` de los 13 repositorios: ya apuntan a Laravel.
- [ ] 🟡 Mover el bloque `"pnpm"` de `package.json` (pnpm 11 ya no lo lee; avisa en cada comando).

## 2. Páginas que son solo un esqueleto (sin formularios)

Estas 4 páginas muestran una tabla, pero **Crear y Editar solo abren un `alert()`**, y cuando la lista está vacía muestran **filas falsas** ("Dato 1", "Dato 2"):

- [x] ✅ `PersonasPage.vue` — CRUD completo (natural/jurídica, varios documentos, validación DNI 8 / RUC 11). Probado contra Laravel.
- [x] ✅ `ItsePage.vue` — registro, edición e inactivación (estándar/renovación, caducidad sugerida +2 años, situación VIGENTE/POR VENCER/VENCIDO/INACTIVO). Probado contra Laravel.
- [x] ✅ **Backend:** `InactivarItseUseCase` ahora guarda `estado_id`, `fecha_estado`, `documento` y `fecha_digitacion` (antes los ignoraba).
- [x] ✅ Modo oscuro en todos los formularios + `color-scheme: dark` para controles nativos.
- [x] ✅ `SearchableSelect`: la lista ya no se corta dentro de los modales (se renderiza en `body` y abre hacia arriba si no hay espacio).
- [x] ✅ Expedientes: `fecha_recepcion` se guardaba en hora de Lima y se leía como UTC (salía un día antes). El backend ahora guarda en UTC; la tabla muestra solo la fecha y los nombres de procedimiento y solicitante.
- [x] ✅ Dashboard con datos reales: expedientes en trámite (`/expedientes/pendientes/`), ITSE vigentes y licencias vigentes.
- [ ] 🔴 `TiposProcedimientoTupaPage.vue`
- [ ] 🔴 `UnidadesOrganicasPage.vue` — la entidad solo tiene 2 campos.

Para cada una: modal de crear/editar (como `GirosPage.vue`), columnas reales, quitar los datos falsos de `getDisplayData()`.

## 3. Portales sin conectar a la API

- [ ] 🔴 `CitizenPortal.vue` (rol `CIUDADANO`/`EMPRESA`) — los datos son `{ data: [] }` fijo; "Solicitar LF", "Pagar" y "Solicitar construcción" solo muestran `alert()`.
- [ ] 🔴 `InspectorPortal.vue` (rol `INSPECTOR`) — lista siempre vacía; "Visto bueno / Observar" solo muestra `alert()`.

## 4. Dashboard

- [x] ✅ (resuelto) `DashboardPage.vue` — las cifras **24 / 8 / 156** (Trámites TUPA, Inspecciones ITSE, Licencias vigentes) están escritas a mano en el HTML. Hay que calcularlas desde la API (p. ej. `expedientes/pendientes`, `itse/consulta`, `licencias-funcionamiento/consulta`).

## 5. Llamadas del frontend que el backend NO soporta

Probado con el backend local (respuesta HTTP real):

| Frontend llama a | Respuesta | Qué hacer |
|---|---|---|
| `GET licencias-funcionamiento/{id}` | **405** (no existe la ruta) | Usar `consulta`/`buscar`, o agregar `show` en backend |
| ~~`GET itse/{id}` (id inexistente)~~ | ✅ 404 | Era el error de permisos de `storage/logs`, ya corregido |
| ~~`DELETE itse/{id}`~~ | ✅ | El front ahora usa `itse/inactivar` |
| `GET/POST/PUT/DELETE unidades-organicas/{id}` | **404 / 405** | El backend solo tiene `GET` (lista). Hacer la página de solo lectura o agregar CRUD en backend |
| `GET estados/` | 200, pero **paginado** `{count, results}` | Ya lo maneja `EstadosRepository`; verificar que el resto (que espera array) no cambie |

## 6. Funciones del backend que el frontend no usa todavía

Endpoints ya listos en Laravel sin pantalla o sin llamada en el front:

**Expedientes**
- [ ] 🟠 Buscar (`expedientes/buscar`), consulta (`consulta`), pendientes (`pendientes`)
- [ ] 🟠 Ampliación de plazo (`{pk}/ampliacion-plazo`)
- [ ] 🟠 Denegar ITSE / denegar licencia (`{pk}/denegar-itse`, `{pk}/denegar-licencia`)
- [ ] 🟠 Autorización improcedente (`{pk}/autorizacion-improcedente`)
- [ ] 🟠 Archivos adjuntos: listar, subir, descargar, eliminar

**Licencias de funcionamiento**
- [ ] 🟠 Buscar, reporte (`reporte`), inactivar (`inactivar`), verificar expediente
- [ ] 🟠 Historial de estados (`{pk}/estados`), giros (`{pk}/giros`), notificación (`{pk}/notificacion`)
- [ ] 🟠 Archivos adjuntos

**ITSE**
- [ ] 🟠 Buscar, por renovar (`por-renovar`), inactivar, verificar expediente
- [ ] 🟠 Estados, giros, inspectores asignados, notificación
- [ ] 🟠 Archivos adjuntos

**Personas / PIDE**
- [ ] 🟠 Consulta RENIEC por DNI (`reniec/consultar`) y SUNAT por RUC (`sunat/consultar`) para autocompletar
- [ ] 🟠 Buscar persona, sexos, documentos de la persona

**Usuarios / sesión**
- [ ] 🟠 Cambiar contraseña (`usuarios/{pk}/cambiar-password`)
- [ ] 🟠 Menús por usuario (`usuarios/menus`) — el sidebar hoy es fijo
- [ ] 🟠 Perfil del usuario actual (`auth/users/me`)

**Otros**
- [ ] 🟡 Estados inactivos LF / ITSE, inspectores/buscar, fecha del servidor (`fecha-servidor`)

## 7. Pendientes ya conocidos (de `_forensics/`)

- [ ] 🟡 Sidebar no se cierra al navegar en móvil (se aceptó la discrepancia y quedó para "etapa posterior").

---

## Lo que SÍ funciona hoy

- Login JWT contra Laravel, con refresh automático del token en 401.
- Redirección por rol (admin / inspector / ciudadano) y guardas de ruta.
- CRUD con modal en: Estados, Expedientes, Giros, Inspectores, Licencias, Niveles de riesgo, Tipos de documento, Tipos de licencia, Usuarios, Zonificaciones (falta probar cada uno con datos reales).
- Todas las listas responden 200 contra el backend local.
