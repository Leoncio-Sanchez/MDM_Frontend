# ✅ Checklist de pendientes — Frontend MDM

**Fecha de revisión:** 2026-10-12
**Contra:** backend Laravel (`MDM_BACKEND`, 115 rutas en `/api`)
**Método:** lectura del código de `src/`, `vue-tsc -b`, y llamadas reales a la API local con las URLs exactas que usa cada repositorio.

> Leyenda: 🔴 bloquea el uso real · 🟠 funcionalidad incompleta · 🟡 calidad / deuda

---

## 1. Build y calidad

- [x] ✅ (resuelto: se eliminó el breadcrumb muerto de AppHeader) **`pnpm build` falla**: `vue-tsc` reporta `AppHeader.vue(42,7): 'currentInfo' is declared but its value is never read` (TS6133). El ACTA de cierre dice "0 errores", ya no es cierto.
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
- [x] ✅ `TiposProcedimientoTupaPage.vue` — CRUD completo; eliminar en uso ofrece desactivar; Expedientes solo ofrece procedimientos activos.
- [x] ✅ `UnidadesOrganicasPage.vue` — CRUD completo (backend nuevo: crear, editar, eliminar protegido por procedimientos TUPA y usuarios; ofrece desactivar).

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
| ~~`GET licencias-funcionamiento/{id}`~~ | ✅ | El front ya no lo usa (lista con `consulta`) |
| ~~`GET itse/{id}` (id inexistente)~~ | ✅ 404 | Era el error de permisos de `storage/logs`, ya corregido |
| ~~`DELETE itse/{id}`~~ | ✅ | El front ahora usa `itse/inactivar` |
| ~~`GET/POST/PUT/DELETE unidades-organicas/{id}`~~ | ✅ | CRUD agregado en el backend |
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
- [x] ✅ Inactivar (modal con motivo, fecha, documento; guarda usuario)
- [ ] 🟠 Buscar, reporte (`reporte`), verificar expediente
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

## 8. Backend: deuda detectada (no bloquea)

- [ ] 🟠 **19 tests fallan en la suite completa** (antes 21; se arreglaron los 2 de TipoDocumentoIdentidad) (Personas, Estados, ITSE unit). Ya fallaban antes; varios pasan al correr el módulo solo → interferencia entre tests (mocks de facades `DB::shouldReceive` que no se limpian).
- [x] ✅ (cerrado) **5 catálogos con escritura sin autenticación**: giros, niveles-riesgo, tipos-documento-identidad, tipos-licencia, zonificaciones (rutas solo con middleware `api`). TUPA ya corregido.
- [ ] 🟡 `phpstan.neon` solo analiza `app/Modules/Estados`. Licencias tiene 110 errores previos (mayoría en Resources).
- [x] ✅ Licencias: rutas sin `auth:api`, datos que se perdían al crear/modificar, inactivación rota (500), usuario no registrado, número duplicado → 500, fechas ISO mal formadas y fecha de emisión en UTC. Corregido con tests (67/67).
- [ ] 🟡 `GET /api/documentation` (Swagger) es público: desactivarlo en producción.
- [ ] 🟡 14 archivos de test crean el usuario `auth_user` a mano: migrarlos al helper `comoUsuarioApi()` de `tests/TestCase.php`.

## 9. Autorización por rol y portales

- [x] ✅ **Cualquier usuario autenticado tenía acceso total a la API de gestión** (un CIUDADANO podía listar usuarios, ver datos personales y crear/modificar/borrar). Ahora 114 rutas exigen `rol:ADMIN_MUNICIPALIDAD` (middleware `VerificarRol`, rol resuelto contra la BD en cada petición).
- [x] ↩️ Rol `INSPECTOR` **retirado**: se basaba en `usuarios_perfiles.es_inspector`, columna que solo existe en la BD local de test (en producción rompía el login de todo no-administrador). El esquema real no tiene forma de marcar a un usuario como inspector.
- [ ] 🔴 **Portal ciudadano bloqueado**: no existe vínculo usuario → persona. Las columnas `auth_user.role/ruc` solo existen en la BD local (migración de test), no en Neon. Hay que definir con el equipo dónde guardar el vínculo (tabla nueva `usuarios_personas` propuesta) y cómo se crean las cuentas de ciudadanos.
- [ ] 🔴 **Portal inspector bloqueado**: la asignación de inspectores (`itse_inspectores`, TD-010) existe en Neon pero no localmente, y no conocemos su esquema exacto. Tampoco existe dónde registrar el resultado de la inspección (conforme / observado). Se necesita el esquema real de Neon y la definición del resultado.

## 10. Esquema real vs código (fuente: `D:/MDM/BD/data-production`, 37 tablas)

- [x] ✅ Unidades Orgánicas ya no consulta `usuarios_perfiles.unidad_organica_id` (no existe en producción).
- [ ] 🔴 **Licencias escribe `licencias_funcionamiento.estado`, columna que no existe en producción** → crear una licencia fallaría.
- [ ] 🔴 **Las migraciones de Laravel no crean el esquema en producción**: 3 migraciones (26 tablas) solo corren con `APP_ENV` `local`/`testing`, y su esquema difiere del real. Hay que escribir migraciones reales a partir del esquema de producción.
- [ ] 🟠 `inspectores` / `itse_inspectores` existen en el dump de junio (`2026.sql`) pero no en el esquema de producción; el módulo Inspectores de Laravel usa `auth_user`.
- [ ] 🟡 El modelo `User` declara `name`, `role`, `ruc` en `$fillable` (no existen en `auth_user`).
- [ ] 🟡 Neon fue eliminado: el `.env.backup` con sus credenciales ya no sirve.
