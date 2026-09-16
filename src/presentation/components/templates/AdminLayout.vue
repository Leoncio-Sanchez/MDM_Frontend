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
    <aside class="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-10">
      <div class="p-5 border-b border-slate-800">
        <span class="font-bold text-lg tracking-wide">Panel Admin</span>
      </div>
      <div class="p-4 bg-slate-800/50 border-b border-slate-800">
        <p class="text-sm font-medium">{{ user?.username }}</p>
      </div>
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <RouterLink to="/admin" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300">Dashboard</RouterLink>
        <RouterLink to="/admin/expedientes" class="block p-3 rounded-lg hover:bg-slate-800 text-sm font-medium text-slate-300">Expedientes</RouterLink>
      </nav>
      <div class="p-4 border-t border-slate-800">
        <button @click="handleLogout" class="w-full py-2 bg-slate-800 hover:bg-red-600 rounded text-sm transition-colors">Cerrar Sesión</button>
      </div>
    </aside>
    <main class="flex-1 overflow-auto p-8">
      <slot />
    </main>
  </div>
</template>
