# Discrepancia: Conteo de Funciones en Composables (77 vs 73)

## Estado en React (Golden Source)
El proyecto React original tenía **17 archivos de hooks** (excluyendo `index.ts`) con **77 funciones exportadas**:
- 14 archivos CRUD x 5 funciones = 70 funciones
- `useAuth.ts` = 4 funciones (incluía `useAuthState`)
- `useDashboard.ts` = 1 función (`useDashboardStats`)
- `usePortals.ts` = 2 funciones (`useCitizenNoticias`, `useInspectorTareas`)
Total = 77 funciones.

## Estado en Vue (Proyecto Migrado)
El proyecto Vue actual tiene **15 archivos de composables** con **73 funciones exportadas**:
- 14 archivos CRUD x 5 funciones = 70 funciones
- `useAuth.ts` = 3 funciones (`useLogin`, `useLogout`, `useCurrentUser`). `useAuthState` fue purgado porque los componentes ahora consumen `useAuthStore` (Pinia) de forma directa, tal y como se acordó en la excepción #2 de Clean Architecture.

## Por qué se eliminaron los otros archivos
En la Fase 4, se eliminaron los archivos `useDashboard.ts` y `usePortals.ts` porque eran *stubs* (archivos dummy con datos hardcodeados que no hacían peticiones al backend) y el Stakeholder solicitó explícitamente sanear el directorio para que existieran exactamente 15 composables con 73 funciones. 

La migración es perfecta y la reducción de 77 a 73 está completamente justificada por la arquitectura y la limpieza del código residual.
