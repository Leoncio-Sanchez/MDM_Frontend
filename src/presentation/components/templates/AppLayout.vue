<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { useUiStore } from '../../../infrastructure/store/useUiStore';
import AppSidebar from '../organisms/AppSidebar.vue';
import AppHeader from '../organisms/AppHeader.vue';

const uiStore = useUiStore();
const route = useRoute();

// Al cambiar de ruta en dispositivos móviles, cerrar el sidebar automáticamente
watch(() => route.path, () => {
  uiStore.closeMobileSidebar();
});
</script>

<template>
  <div class="flex h-screen bg-[#f4f4f4] dark:bg-[#111113] font-sans overflow-hidden transition-colors duration-200">
    <!-- Backdrop Overlay para Móvil -->
    <div 
      v-if="uiStore.isMobileSidebarOpen" 
      @click="uiStore.closeMobileSidebar()"
      class="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
      aria-label="Cerrar menú móvil"
    ></div>

    <!-- Sidebar: Drawer en Móvil, Estático/Colapsable en Desktop -->
    <div 
      :class="[
        'fixed inset-y-0 left-0 z-50 transform lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out flex',
        uiStore.isMobileSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <AppSidebar />
    </div>

    <!-- Área Principal de la Aplicación (Cuerpo #f4f4f4 / Dark) -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f4f4] dark:bg-[#111113] transition-colors duration-200">
      <!-- Topbar Global Reutilizable -->
      <AppHeader />

      <!-- Contenedor Único de Vistas -->
      <main class="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-[#f4f4f4] dark:bg-[#111113] transition-colors duration-200">
        <router-view />
      </main>
    </div>
  </div>
</template>
