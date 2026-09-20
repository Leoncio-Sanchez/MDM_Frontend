import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';

const routes = [
  { 
    path: '/login', 
    name: 'login', 
    component: () => import('../pages/LoginPage.vue'), 
    meta: { public: true } 
  },
  {
    path: '/',
    name: 'root',
    component: () => import('../components/templates/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'redirect',
        redirect: () => {
          const authStore = useAuthStore();
          const role = authStore.user?.role;
          if (role === 'CIUDADANO' || role === 'EMPRESA') return '/ciudadano';
          if (role === 'INSPECTOR') return '/inspector';
          // admin, ADMIN_MUNICIPALIDAD, or any authenticated user goes to admin dashboard
          return '/admin';
        }
      },
      {
        path: 'ciudadano',
        name: 'ciudadano',
        component: () => import('../pages/CitizenPortal.vue'),
        meta: { allowedRoles: ['CIUDADANO', 'EMPRESA'] }
      },
      {
        path: 'inspector',
        name: 'inspector',
        component: () => import('../pages/InspectorPortal.vue'),
        meta: { allowedRoles: ['INSPECTOR'] }
      },
      {
        path: 'admin',
        name: 'admin',
        component: () => import('../pages/DashboardPage.vue'),
        meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] }
      },
      { path: 'admin/estados', component: () => import('../pages/EstadosPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/expedientes', component: () => import('../pages/ExpedientesPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/giros', component: () => import('../pages/GirosPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/inspectores', component: () => import('../pages/InspectoresPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/itse', component: () => import('../pages/ItsePage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/licencias-funcionamiento', component: () => import('../pages/LicenciasFuncionamientoPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/niveles-riesgo', component: () => import('../pages/NivelesRiesgoPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/personas', component: () => import('../pages/PersonasPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/tipos-documento-identidad', component: () => import('../pages/TiposDocumentoIdentidadPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/tipos-licencia', component: () => import('../pages/TiposLicenciaPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/tipos-procedimiento-tupa', component: () => import('../pages/TiposProcedimientoTupaPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/unidades-organicas', component: () => import('../pages/UnidadesOrganicasPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/usuarios', component: () => import('../pages/UsuariosPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } },
      { path: 'admin/zonificaciones', component: () => import('../pages/ZonificacionesPage.vue'), meta: { allowedRoles: ['ADMIN_MUNICIPALIDAD'] } }
    ]
  },
  { path: '/:pathMatch(.*)*', redirect: '/' }
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = !!authStore.token;

  if (!to.meta.public && !isAuthenticated) {
    next({ name: 'login' });
  } else if (to.meta.public && isAuthenticated) {
    next({ name: 'root' });
  } else {
    if (to.meta.allowedRoles) {
      // TODO(MIGRATION): During coexistence phase, Django users have 'admin'/'unknown' roles.
      // Only block if user explicitly has a mismatched role. Allow access otherwise.
      const roles = to.meta.allowedRoles as string[];
      const userRole = authStore.user?.role ?? '';
      const hasKnownRole = ['CIUDADANO', 'EMPRESA', 'INSPECTOR', 'ADMIN_MUNICIPALIDAD'].includes(userRole);
      if (hasKnownRole && !roles.includes(userRole)) {
        if (userRole === 'CIUDADANO' || userRole === 'EMPRESA') return next('/ciudadano');
        if (userRole === 'INSPECTOR') return next('/inspector');
        return next('/admin');
      }
    }
    next();
  }
});
