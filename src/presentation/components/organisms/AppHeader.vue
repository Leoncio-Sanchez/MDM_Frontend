<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../../infrastructure/store/useAuthStore';
import { useUiStore } from '../../../infrastructure/store/useUiStore';
import { useLogout } from '../../../application/composables/useAuth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const uiStore = useUiStore();
const logoutMutation = useLogout();

const user = computed(() => authStore.user);
const isLogoutModalOpen = ref(false);

interface RouteMetaInfo {
  section: string;
  title: string;
}

const routeMap: Record<string, RouteMetaInfo> = {
  '/admin': { section: 'Operaciones', title: 'Dashboard General' },
  '/admin/expedientes': { section: 'Operaciones', title: 'Expedientes TUPA' },
  '/admin/licencias-funcionamiento': { section: 'Operaciones', title: 'Licencias de Funcionamiento' },
  '/admin/itse': { section: 'Operaciones', title: 'Inspecciones ITSE' },
  '/admin/inspectores': { section: 'Operaciones', title: 'Inspectores Técnicos' },
  '/admin/personas': { section: 'Catálogos Maestros', title: 'Personas / Administrados' },
  '/admin/giros': { section: 'Catálogos Maestros', title: 'Giros Comerciales (CIIU)' },
  '/admin/zonificaciones': { section: 'Catálogos Maestros', title: 'Zonificaciones Urbanas' },
  '/admin/niveles-riesgo': { section: 'Catálogos Maestros', title: 'Niveles de Riesgo' },
  '/admin/tipos-procedimiento-tupa': { section: 'Catálogos Maestros', title: 'Procedimientos TUPA' },
  '/admin/tipos-licencia': { section: 'Catálogos Maestros', title: 'Tipos de Licencia' },
  '/admin/tipos-documento-identidad': { section: 'Catálogos Maestros', title: 'Tipos de Documento' },
  '/admin/estados': { section: 'Administración', title: 'Estados del Sistema' },
  '/admin/unidades-organicas': { section: 'Administración', title: 'Unidades Orgánicas' },
  '/admin/usuarios': { section: 'Administración', title: 'Usuarios y Permisos' },
  '/ciudadano': { section: 'Portal Ciudadano', title: 'Mis Trámites' },
  '/inspector': { section: 'Portal Inspector', title: 'Hoja de Ruta ITSE' },
};

const currentInfo = computed<RouteMetaInfo>(() => {
  return routeMap[route.path] || {
    section: 'Panel',
    title: 'Gestión Municipal'
  };
});

const openLogoutModal = () => {
  isLogoutModalOpen.value = true;
};

const cancelLogout = () => {
  isLogoutModalOpen.value = false;
};

const confirmLogout = () => {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      isLogoutModalOpen.value = false;
      router.push('/login');
    }
  });
};
</script>

<template>
  <header class="h-16 bg-[#00356a] border-b border-[#1b2a47] px-4 sm:px-6 flex items-center justify-between shadow-xs shrink-0 z-30 select-none transition-colors duration-200">
    
    <!-- Lado Izquierdo: Botón Hamburguesa / Colapsador + Breadcrumb limpio -->
    <div class="flex items-center gap-3 sm:gap-4 min-w-0">
      <!-- Botón de Hamburguesa / Toggle Sidebar -->
      <button 
        @click="uiStore.toggleSidebar()"
        class="p-2 -ml-1 text-slate-300 hover:text-white hover:bg-[#152642] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
        :title="uiStore.isSidebarCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'"
        aria-label="Alternar barra lateral"
      >
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

     <!--  Breadcrumb minimalista y limpio 
        <nav class="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium min-w-0">
        <span class="text-blue-300/60 hidden md:inline">MUNI_APP</span>
        <span class="text-blue-400/30 hidden md:inline">/</span>
        <span class="text-blue-200/80 hidden sm:inline truncate">{{ currentInfo.section }}</span>
        <span class="text-blue-400/30 hidden sm:inline">/</span>
        <span class="text-white font-bold truncate">{{ currentInfo.title }}</span>
      </nav>-->
    </div>

    <!-- Lado Derecho: Botón de Tema + Usuario de Sesión + Botón Cerrar Sesión -->
    <div class="flex items-center gap-3 sm:gap-4 shrink-0">
      
      <!-- Botón de Tema (Modo Claro / Modo Oscuro) - Solo Icono Animado -->
      <button 
        @click="uiStore.toggleTheme()"
        type="button"
        class="relative w-9 h-9 rounded-xl flex items-center justify-center border border-[#22385e] bg-[#152642] text-slate-200 hover:border-blue-400 shadow-2xs hover:shadow-xs transition-all duration-300 cursor-pointer overflow-hidden group focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        :title="uiStore.isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
        :aria-label="uiStore.isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro'"
      >
        <!-- Icono Sol (Modo Claro) con animación de rotación y escala -->
        <svg 
          class="w-4.5 h-4.5 text-amber-400 transition-all duration-500 transform absolute"
          :class="uiStore.isDarkMode ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 group-hover:rotate-45'"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>

        <!-- Icono Luna (Modo Oscuro) con animación de rotación y escala -->
        <svg 
          class="w-4.5 h-4.5 text-indigo-300 transition-all duration-500 transform absolute"
          :class="uiStore.isDarkMode ? 'opacity-100 rotate-0 scale-100 group-hover:-rotate-12' : 'opacity-0 -rotate-90 scale-0'"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </button>

      <!-- Separador vertical sutil entre tema y usuario -->
      <div class="h-6 w-px bg-[#1b2a47]"></div>

      <!-- Información del Usuario en Sesión -->
      <div class="flex items-center gap-2.5">
        <div class="text-right hidden sm:block">
          <p class="text-xs font-bold text-white leading-tight">{{ user?.username }}</p>
          <span class="inline-block text-[10px] font-semibold text-blue-300 bg-blue-900/60 border border-blue-700/60 px-1.5 py-0.2 rounded mt-0.5">
            {{ user?.role === 'ADMIN_MUNICIPALIDAD' ? 'Administrador' : user?.role }}
          </span>
        </div>
        
        <div class="w-9 h-9 rounded-full bg-[#0d6efd] text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-blue-400/40">
          {{ user?.username?.charAt(0).toUpperCase() }}
        </div>
      </div>

      <!-- Separador vertical sutil -->
      <div class="h-6 w-px bg-[#1b2a47]"></div>

      <!-- Botón Cerrar Sesión con Confirmación de Seguridad -->
      <button 
        @click="openLogoutModal"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#22385e] bg-[#152642] text-xs font-semibold text-slate-200 hover:text-red-400 hover:border-red-800 hover:bg-red-950/40 transition-all shadow-2xs group cursor-pointer"
        title="Cerrar sesión del sistema"
      >
        <svg class="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span class="hidden sm:inline">Cerrar Sesión</span>
      </button>
    </div>
  </header>

  <!-- Modal de Alerta de Seguridad para Cerrar Sesión -->
  <teleport to="body">
    <div 
      v-if="isLogoutModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs select-none transition-all"
      @click.self="cancelLogout"
    >
      <div 
        class="bg-white dark:bg-neutral-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 transform transition-all animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        <!-- Icono de Seguridad / Alerta -->
        <div class="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <!-- Título y Mensaje -->
        <div class="text-center">
          <h3 id="modal-headline" class="text-lg font-bold text-neutral-900 dark:text-white">
            Confirmación de Seguridad
          </h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
            ¿Está seguro de que desea salir del sistema <strong class="text-neutral-800 dark:text-neutral-200">MUNI_APP</strong>? Su sesión activa actual para <span class="font-semibold text-neutral-800 dark:text-neutral-200 font-mono">@{{ user?.username }}</span> finalizará de forma segura.
          </p>
        </div>

        <!-- Botones de Acción: Cancelar y Confirmar -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <button 
            type="button"
            @click="cancelLogout"
            class="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-2xs cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button"
            @click="confirmLogout"
            :disabled="logoutMutation.isPending.value"
            class="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span v-if="logoutMutation.isPending.value" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>
