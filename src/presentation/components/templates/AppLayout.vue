<script setup lang="ts">
import { useLogout } from '../../../application/composables/useAuth';
import { useAuthStore } from '../../../infrastructure/store/useAuthStore';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const user = authStore.user;
const logoutMutation = useLogout();
const router = useRouter();

const handleLogout = () => {
  logoutMutation.mutate(undefined, {
    onSuccess: () => {
      router.push('/login');
    }
  });
};
</script>

<template>
  <div class="flex h-screen bg-gray-50 font-sans">
    <!-- Sidebar - Recuperando el diseño original del bundle -->
    <aside class="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
      <div class="p-5 border-b border-slate-800 flex items-center gap-3">
        <div class="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold shadow">LF</div>
        <span class="font-bold text-lg tracking-wide">Sistema ITSE</span>
      </div>
      
      <div class="p-4 bg-slate-800/50 border-b border-slate-800">
        <p class="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Usuario Conectado</p>
        <p class="text-sm font-medium">{{ user?.username }}</p>
        <p class="text-xs text-blue-400 mt-1">{{ user?.role }} {{ user?.ruc ? `(${user.ruc})` : '' }}</p>
      </div>

      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <!-- Menú dinámico basado en ROL para mantener el mismo diseño visual para todos -->
        <template v-if="user?.role === 'CIUDADANO' || user?.role === 'EMPRESA'">
          <a href="/ciudadano" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all">Mis Trámites LF / LC</a>
        </template>

        <template v-if="user?.role === 'INSPECTOR'">
          <a href="/inspector" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all">Hoja de Ruta (Inspecciones)</a>
        </template>

        <template v-if="user?.role === 'ADMIN_MUNICIPALIDAD'">
          <router-link to="/admin" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all">Dashboard General</router-link>
          <router-link to="/admin/expedientes" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all">Expedientes TUPA</router-link>
          <router-link to="/admin/estados" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300 hover:text-white transition-all">Estados</router-link>
        </template>
      </nav>

      <div class="p-4 border-t border-slate-800">
        <button @click="handleLogout" class="w-full py-2.5 bg-slate-800 hover:bg-red-600/90 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
          Cerrar Sesión
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 overflow-auto flex flex-col">
      <!-- Topbar original del diseño -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">
        <h1 class="text-xl font-semibold text-gray-800 capitalize">
          {{ user?.role === 'CIUDADANO' ? 'Portal del Ciudadano' : 
           user?.role === 'INSPECTOR' ? 'Módulo de Inspección Técnica' : 
           'Panel Administrativo' }}
        </h1>
        <div class="flex items-center gap-3">
           <div class="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
              {{ user?.username?.charAt(0).toUpperCase() }}
           </div>
        </div>
      </header>
      
      <!-- Area de trabajo -->
      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>
