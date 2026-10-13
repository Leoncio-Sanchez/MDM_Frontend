<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../../infrastructure/store/useAuthStore';
import { useUiStore } from '../../../infrastructure/store/useUiStore';
import type { Permiso } from '../../../domain/entities/User.entity';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();

const user = computed(() => authStore.user);
const isCollapsed = computed(() => uiStore.isSidebarCollapsed);

interface NavItem {
  to: string;
  label: string;
  exact?: boolean;
  path: string;
}

interface NavSection {
  title: string;
  indicatorColor: string;
  items: NavItem[];
}

const adminSections: NavSection[] = [
  {
    title: 'Operaciones',
    indicatorColor: 'bg-[#0d6efd]',
    items: [
      {
        to: '/admin',
        exact: true,
        label: 'Dashboard General',
        path: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
      },
      {
        to: '/admin/expedientes',
        label: 'Expedientes TUPA',
        path: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z'
      },
      {
        to: '/admin/licencias-funcionamiento',
        label: 'Licencias de Funcionamiento',
        path: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
      },
      {
        to: '/admin/itse',
        label: 'Inspecciones ITSE',
        path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      {
        to: '/admin/inspectores',
        label: 'Inspectores Técnicos',
        path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
      }
    ]
  },
  {
    title: 'Catálogos Maestros',
    indicatorColor: 'bg-emerald-600',
    items: [
      {
        to: '/admin/personas',
        label: 'Personas / Administrados',
        path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
      },
      {
        to: '/admin/giros',
        label: 'Giros Comerciales (CIIU)',
        path: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
      },
      {
        to: '/admin/zonificaciones',
        label: 'Zonificaciones',
        path: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'
      },
      {
        to: '/admin/niveles-riesgo',
        label: 'Niveles de Riesgo',
        path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
      },
      {
        to: '/admin/tipos-procedimiento-tupa',
        label: 'Procedimientos TUPA',
        path: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
      },
      {
        to: '/admin/tipos-licencia',
        label: 'Tipos de Licencia',
        path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
      },
      {
        to: '/admin/tipos-documento-identidad',
        label: 'Tipos de Documento',
        path: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2'
      }
    ]
  },
  {
    title: 'Administración',
    indicatorColor: 'bg-indigo-600',
    items: [
      {
        to: '/admin/estados',
        label: 'Estados del Sistema',
        path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
      },
      {
        to: '/admin/unidades-organicas',
        label: 'Unidades Orgánicas',
        path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
      },
      {
        to: '/admin/usuarios',
        label: 'Usuarios y Permisos',
        path: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
      }
    ]
  }
];

// Solo las opciones que el perfil del usuario permite (los accesos se definen en el router)
const seccionesVisibles = computed(() =>
  adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        authStore.puede(router.resolve(item.to).meta.permisos as Permiso[] | undefined)
      ),
    }))
    .filter((section) => section.items.length > 0)
);

const isItemActive = (item: NavItem): boolean => {
  if (item.exact) {
    return route.path === item.to;
  }
  return route.path.startsWith(item.to);
};
</script>

<template>
  <aside 
    :class="[
      isCollapsed ? 'w-20' : 'w-72',
      'bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 flex flex-col border-0 border-neutral-200 dark:border-neutral-800 shadow-xs z-20 shrink-0 select-none transition-[width,background-color,border-color] duration-300 ease-in-out'
    ]"
  >
    <!-- Brand / Logo Municipal -->
    <div class="h-16 border-0 border-0 flex items-center px-4 bg-[#00356a] overflow-hidden shrink-0 transition-colors">
      <!-- Versión Expandida -->
      <div v-if="!isCollapsed" class="flex items-center gap-3 w-full">
        <div class="w-10 h-10 flex items-center justify-center shrink-0">
          <img 
            src="/images/escudo-dashboard.png" 
            alt="Escudo Municipal" 
            class="h-10 w-auto max-w-[38px] object-contain drop-shadow-xs" 
          />
        </div>
        <div class="flex flex-col truncate">
          <span class="font-bold text-base text-white tracking-tight leading-tight">MUNI_APP</span>
          <span class="text-[11px] font-medium text-blue-300/80 tracking-wide uppercase">Sistema LF & ITSE</span>
        </div>
      </div>

      <!-- Versión Colapsada: Solo Escudo Centrado -->
      <div v-else class="w-full flex justify-center items-center">
        <img 
          src="/images/escudo-dashboard.png" 
          alt="Escudo Municipal" 
          class="h-9 w-auto max-w-[34px] object-contain drop-shadow-xs" 
          title="MUNI_APP · Sistema LF & ITSE"
        />
      </div>
    </div>

    <!-- Menú de Navegación con Estructura de Árbol y Sangría Pronunciada -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-sm overflow-x-hidden bg-white dark:bg-[#18181b]">
      
      <!-- Vista para Ciudadano / Empresa -->
      <template v-if="user?.role === 'CIUDADANO' || user?.role === 'EMPRESA'">
        <div>
          <p v-if="!isCollapsed" class="px-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0d6efd]"></span>
            Mis Trámites
          </p>
          <div v-else class="border-t border-neutral-200 dark:border-neutral-800 my-2"></div>

          <div :class="!isCollapsed ? 'ml-3.5 pl-3.5 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-1' : 'space-y-1'">
            <router-link 
              to="/ciudadano" 
              :class="[
                isCollapsed ? 'justify-center p-2.5 mx-auto' : 'px-3 py-2 gap-2.5',
                route.path.startsWith('/ciudadano')
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0d6efd] dark:text-blue-400 font-semibold shadow-xs border border-blue-100 dark:border-blue-900/50'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium',
                'relative flex items-center rounded-lg text-[13px] transition-all duration-150 group'
              ]"
              :title="isCollapsed ? 'Trámites LF / LC' : ''"
            >
              <!-- Indicador Activo de Acento Izquierdo -->
              <span 
                v-if="route.path.startsWith('/ciudadano') && !isCollapsed" 
                class="absolute -left-[16px] top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r bg-[#0d6efd] shadow-xs shadow-[#0d6efd]/30"
              ></span>

              <svg 
                :class="route.path.startsWith('/ciudadano') ? 'text-[#0d6efd] dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'"
                class="w-4 h-4 shrink-0 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="1.75"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span v-if="!isCollapsed" class="truncate">Trámites LF / LC</span>
            </router-link>
          </div>
        </div>
      </template>

      <!-- Vista para Inspector -->
      <template v-if="user?.role === 'INSPECTOR'">
        <div>
          <p v-if="!isCollapsed" class="px-2 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0d6efd]"></span>
            Inspecciones
          </p>
          <div v-else class="border-t border-neutral-200 dark:border-neutral-800 my-2"></div>

          <div :class="!isCollapsed ? 'ml-3.5 pl-3.5 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-1' : 'space-y-1'">
            <router-link 
              to="/inspector" 
              :class="[
                isCollapsed ? 'justify-center p-2.5 mx-auto' : 'px-3 py-2 gap-2.5',
                route.path.startsWith('/inspector')
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0d6efd] dark:text-blue-400 font-semibold shadow-xs border border-blue-100 dark:border-blue-900/50'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium',
                'relative flex items-center rounded-lg text-[13px] transition-all duration-150 group'
              ]"
              :title="isCollapsed ? 'Hoja de Ruta ITSE' : ''"
            >
              <!-- Indicador Activo de Acento Izquierdo -->
              <span 
                v-if="route.path.startsWith('/inspector') && !isCollapsed" 
                class="absolute -left-[16px] top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r bg-[#0d6efd] shadow-xs shadow-[#0d6efd]/30"
              ></span>

              <svg 
                :class="route.path.startsWith('/inspector') ? 'text-[#0d6efd] dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'"
                class="w-4 h-4 shrink-0 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="1.75"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span v-if="!isCollapsed" class="truncate">Hoja de Ruta ITSE</span>
            </router-link>
          </div>
        </div>
      </template>

      <!-- Vista para Administrador Municipal: Secciones Dinámicas con Árbol -->
      <template v-if="user?.role === 'ADMIN_MUNICIPALIDAD'">
        <div 
          v-for="(section, sIdx) in seccionesVisibles" 
          :key="section.title" 
          :class="sIdx > 0 && isCollapsed ? 'pt-2' : ''"
        >
          <!-- Título de Sección (Modo Expandido) -->
          <div v-if="!isCollapsed" class="px-2 mb-2 flex items-center justify-between">
            <span class="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <span :class="['w-1.5 h-1.5 rounded-full', section.indicatorColor]"></span>
              {{ section.title }}
            </span>
            <span class="text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.2 rounded font-mono border border-neutral-200 dark:border-neutral-700 shadow-2xs">
              {{ section.items.length }}
            </span>
          </div>

          <!-- Divisor Sutil (Modo Colapsado) -->
          <div v-else class="border-t border-neutral-200 dark:border-neutral-800 my-2"></div>

          <!-- Contenedor con Sangría (Árbol / Tree Branch) -->
          <div 
            :class="[
              !isCollapsed ? 'ml-3.5 pl-3.5 border-l-2 border-neutral-200 dark:border-neutral-700 space-y-1 relative' : 'space-y-1'
            ]"
          >
            <router-link 
              v-for="item in section.items" 
              :key="item.to"
              :to="item.to"
              :class="[
                isCollapsed ? 'justify-center p-2.5 mx-auto' : 'px-3 py-2 gap-2.5',
                isItemActive(item)
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-[#0d6efd] dark:text-blue-400 font-semibold shadow-xs border border-blue-100 dark:border-blue-900/50'
                  : 'text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800/60 font-medium',
                'relative flex items-center rounded-lg text-[13px] transition-all duration-150 group'
              ]"
              :title="isCollapsed ? item.label : ''"
            >
              <!-- Indicador Activo: Barra lateral izquierda azul viva y moderna -->
              <span 
                v-if="isItemActive(item) && !isCollapsed" 
                class="absolute -left-[16px] top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r bg-[#0d6efd] shadow-xs shadow-[#0d6efd]/30"
              ></span>

              <!-- Icono con resaltado azul Bootstrap Primary -->
              <svg 
                :class="isItemActive(item) ? 'text-[#0d6efd] dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-200'"
                class="w-4 h-4 shrink-0 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                stroke-width="1.75"
              >
                <path stroke-linecap="round" stroke-linejoin="round" :d="item.path" />
              </svg>

              <!-- Texto del Módulo (Modo Expandido) -->
              <span v-if="!isCollapsed" class="truncate">{{ item.label }}</span>
            </router-link>
          </div>
        </div>
      </template>
    </nav>

    <!-- Footer: Copyright Municipal MDM -->
    <div class="border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181b] select-none shrink-0 transition-colors">
      <!-- Versión Expandida -->
      <div v-if="!isCollapsed" class="px-4 py-3 text-center">
        <p class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 tracking-wide">Copyright © 2026 MDM</p>
        <p class="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">Municipalidad Distrital</p>
      </div>

      <!-- Versión Colapsada: Badge Mínimo -->
      <div v-else class="py-3 text-center" title="Copyright © 2026 MDM">
        <span class="text-[10px] font-bold text-[#0d6efd] dark:text-blue-400">© 2026</span>
      </div>
    </div>
  </aside>
</template>
