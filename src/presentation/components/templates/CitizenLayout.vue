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
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="text-2xl font-extrabold text-blue-600">Trámites Muni</div>
          <nav class="hidden md:flex space-x-4">
            <a href="/ciudadano" class="text-gray-600 hover:text-blue-600 font-medium">Mis Trámites</a>
            <a href="#" class="text-gray-600 hover:text-blue-600 font-medium">Requisitos TUPA</a>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-sm text-gray-500">RUC: {{ user?.ruc }}</div>
          <button @click="handleLogout" class="text-sm font-medium text-red-600 hover:text-red-800">Salir</button>
        </div>
      </div>
    </header>
    <main class="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
    <footer class="bg-gray-800 text-white text-center py-4 mt-auto">
      <p class="text-sm">Municipalidad - Portal de Ciudadanos y Empresas</p>
    </footer>
  </div>
</template>
