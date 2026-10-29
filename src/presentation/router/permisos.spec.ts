import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { router } from './index';
import AppSidebar from '../components/organisms/AppSidebar.vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import type { Permiso, Permisos, User } from '../../domain/entities/User.entity';

/**
 * Qué ve cada perfil (ver _docs/PERFILES_Y_ACCESOS.md del backend): las opciones del menú y
 * a dónde lo lleva el router si escribe a mano una ruta que no le corresponde.
 * El servidor aplica las mismas reglas; esto cuida que la interfaz no muestre de más.
 */

const SIN_ACCESOS: Permisos = {
  expedientes: false, licencias: false, itse: false, admin: false, inspector: false, jefe_itse: false, reportes: false,
};

const perfil = (role: User['role'], ...accesos: Permiso[]): User => ({
  id: 1,
  username: 'prueba',
  role,
  permisos: { ...SIN_ACCESOS, ...Object.fromEntries(accesos.map((a) => [a, true])) },
});

const CATALOGOS = [
  '/admin/giros', '/admin/zonificaciones', '/admin/niveles-riesgo', '/admin/tipos-procedimiento-tupa',
  '/admin/tipos-licencia', '/admin/tipos-documento-identidad', '/admin/estados', '/admin/unidades-organicas',
];
const OFICINA_ITSE = ['/admin', '/admin/expedientes', '/admin/itse', '/admin/itse/por-renovar', '/admin/inspectores', '/admin/reportes', '/admin/personas'];

const MENU_ESPERADO: [string, User, string[]][] = [
  ['mesa de partes', perfil('ADMIN_MUNICIPALIDAD', 'expedientes'), ['/admin', '/admin/expedientes', '/admin/reportes', '/admin/personas']],
  ['oficina de licencias', perfil('ADMIN_MUNICIPALIDAD', 'licencias'), ['/admin', '/admin/expedientes', '/admin/licencias-funcionamiento', '/admin/reportes', '/admin/personas']],
  ['oficina de ITSE', perfil('ADMIN_MUNICIPALIDAD', 'itse'), OFICINA_ITSE],
  ['jefatura de ITSE', perfil('ADMIN_MUNICIPALIDAD', 'itse', 'jefe_itse'), [...OFICINA_ITSE, '/admin/itse/asignaciones']],
  ['personal de ITSE que también inspecciona', perfil('ADMIN_MUNICIPALIDAD', 'itse', 'inspector'), [...OFICINA_ITSE, '/inspector']],
  ['administrador de TI', perfil('ADMIN_MUNICIPALIDAD', 'admin'), ['/admin', '/admin/personas', ...CATALOGOS, '/admin/usuarios', '/admin/configuracion']],
  ['auditor', perfil('ADMIN_MUNICIPALIDAD', 'reportes'), ['/admin', '/admin/reportes']],
  ['personal sin accesos', perfil('ADMIN_MUNICIPALIDAD'), ['/admin']],
  ['inspector de campo', perfil('INSPECTOR', 'inspector'), ['/inspector']],
  ['ciudadano', perfil('CIUDADANO'), ['/ciudadano']],
];

// Un solo almacén para todo el archivo: el router queda instalado en la app del menú y
// lee la sesión de ahí; antes de cada prueba se cierra la sesión
const pinia = createPinia();

const iniciarSesion = (usuario: User) => {
  const auth = useAuthStore();
  auth.setUser(usuario, 'token-de-prueba');
  // El router relee el perfil del servidor; aquí el perfil es el de la prueba
  vi.spyOn(auth, 'refrescarUsuario').mockResolvedValue(undefined);
};

const ir = async (ruta: string) => {
  await router.push(ruta).catch(() => undefined);
  await flushPromises();
  return router.currentRoute.value.path;
};

beforeEach(async () => {
  localStorage.clear();
  setActivePinia(pinia);
  useAuthStore().clearUser();
  // Cada prueba parte de una ruta neutra: navegar a la ruta en la que ya está no pasa por las guardas
  await ir('/consulta');
});

describe('menú lateral según el perfil', () => {
  it.each(MENU_ESPERADO)('%s ve solo sus opciones', async (_nombre, usuario, esperado) => {
    iniciarSesion(usuario);

    const menu = mount(AppSidebar, { global: { plugins: [router, pinia] } });
    await flushPromises();

    const enlaces = menu.findAll('nav a').map((a) => a.attributes('href'));
    expect([...new Set(enlaces)].sort()).toEqual([...esperado].sort());
  });
});

describe('rutas escritas a mano', () => {
  it('sin sesión todo lleva al login, salvo la consulta pública', async () => {
    expect(await ir('/admin/expedientes')).toBe('/login');
    expect(await ir('/inspector')).toBe('/login');
    expect(await ir('/consulta')).toBe('/consulta');
  });

  it('una pantalla ajena devuelve al dashboard', async () => {
    iniciarSesion(perfil('ADMIN_MUNICIPALIDAD', 'reportes'));
    expect(await ir('/admin/usuarios')).toBe('/admin');
    expect(await ir('/admin/expedientes')).toBe('/admin');
    expect(await ir('/admin/itse/asignaciones')).toBe('/admin');
    expect(await ir('/admin/reportes')).toBe('/admin/reportes');
  });

  it('la oficina de ITSE no entra a asignar inspecciones ni a la bandeja del inspector', async () => {
    iniciarSesion(perfil('ADMIN_MUNICIPALIDAD', 'itse'));
    expect(await ir('/admin/itse')).toBe('/admin/itse');
    expect(await ir('/admin/itse/asignaciones')).toBe('/admin');
    expect(await ir('/inspector')).toBe('/admin');
    expect(await ir('/admin/licencias-funcionamiento')).toBe('/admin');
  });

  it('el inspector de campo solo ve su bandeja', async () => {
    iniciarSesion(perfil('INSPECTOR', 'inspector'));
    expect(await ir('/admin')).toBe('/inspector');
    expect(await ir('/admin/expedientes')).toBe('/inspector');
    expect(await ir('/inspector/acta/12')).toBe('/inspector/acta/12');
  });

  it('el ciudadano no entra al panel', async () => {
    iniciarSesion(perfil('CIUDADANO'));
    expect(await ir('/admin')).toBe('/ciudadano');
    expect(await ir('/inspector')).toBe('/ciudadano');
  });

  it('con sesión, el login lleva a la pantalla de inicio de cada rol', async () => {
    iniciarSesion(perfil('INSPECTOR', 'inspector'));
    expect(await ir('/login')).toBe('/inspector');

    useAuthStore().clearUser();
    await ir('/consulta');
    iniciarSesion(perfil('ADMIN_MUNICIPALIDAD', 'itse'));
    expect(await ir('/login')).toBe('/admin');
  });
});
