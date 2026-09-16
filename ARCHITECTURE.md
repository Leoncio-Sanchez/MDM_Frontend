# Architecture Document

## Clean Architecture Exceptions
1. **Presentation -> Infrastructure (`useAuth.ts`)**: The auth composables consume the auth store directly instead of routing through application services, to leverage Pinia's reactvity directly.
2. **Presentation -> Infrastructure (`useAuthStore`)**: The layouts (AppLayout, AdminLayout, etc) import `useAuthStore` directly to check the user role and authenticate routes. This avoids creating an intermediary composable just to expose state.
3. **Hooks vs Composables (Conteo 77 vs 73)**: Se purgaron hooks dummy (`useDashboard.ts`, `usePortals.ts`) y se consolidó el estado de Auth en Pinia (purgando `useAuthState`), justificando el conteo de 73 funciones exportadas en 15 composables frente a los 77 originales.
