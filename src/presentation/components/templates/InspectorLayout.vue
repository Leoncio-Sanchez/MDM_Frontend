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
  <div class="min-h-screen bg-slate-50">
    <header class="bg-emerald-600 shadow-md text-white sticky top-0 z-50">
      <div class="px-4 py-3 flex justify-between items-center">
        <div>
          <h1 class="font-bold text-lg">App Inspector</h1>
          <p class="text-xs text-emerald-100">{{ user?.username }}</p>
        </div>
        <button @click="handleLogout" class="p-2 bg-emerald-700 rounded text-sm hover:bg-red-600 transition-colors">Salir</button>
      </div>
    </header>
    <main class="p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <slot />
    </main>
  </div>
</template>
