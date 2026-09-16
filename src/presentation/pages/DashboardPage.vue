<script setup lang="ts">
import { useAuthStore } from '../../infrastructure/store/useAuthStore';

const authStore = useAuthStore();
const user = authStore.user;
</script>

<template>
  <div class="bg-gray-50 min-h-screen">
    <header class="bg-white shadow-sm px-8 py-4 mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Bienvenido al Sistema ITSE</h1>
        <p class="text-gray-500 mt-1">Has iniciado sesión como {{ user?.role }}</p>
      </div>
    </header>
    
    <div class="px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
          <h3 class="text-lg font-semibold text-gray-700">Expedientes Pendientes</h3>
          <p class="text-3xl font-bold mt-2">24</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <h3 class="text-lg font-semibold text-gray-700">Inspecciones Hoy</h3>
          <p class="text-3xl font-bold mt-2">8</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-500">
          <h3 class="text-lg font-semibold text-gray-700">Licencias Emitidas</h3>
          <p class="text-3xl font-bold mt-2">156</p>
        </div>
      </div>
    </div>
  </div>
</template>
