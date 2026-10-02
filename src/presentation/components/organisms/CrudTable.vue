<script setup lang="ts">
import Button from '../atoms/Button.vue';

interface Column {
  key: string;
  label: string;
}

interface Props {
  title: string;
  columns: Column[];
  data: any[];
  isLoading?: boolean;
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  add: [];
  edit: [item: any];
  delete: [item: any];
}>();
</script>

<template>
  <div class="bg-white dark:bg-[#18181b] rounded-2xl shadow-xs border border-neutral-200 dark:border-neutral-800 overflow-hidden transition-colors">
    <div class="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-[#18181b] transition-colors">
      <h2 class="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100 tracking-tight">{{ title }}</h2>
      <Button variant="primary" @click="emit('add')" class="shadow-xs cursor-pointer">+ Nuevo Registro</Button>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
        <thead class="bg-neutral-100/75 dark:bg-neutral-800/60">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-6 py-3.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              {{ col.label }}
            </th>
            <th class="px-6 py-3.5 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-[#18181b] divide-y divide-neutral-200 dark:divide-neutral-800/80 transition-colors">
          <tr v-if="isLoading">
            <td :colspan="columns.length + 1" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
              <div class="flex items-center justify-center gap-2">
                <span class="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                <span>Cargando datos del servidor...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + 1" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
              No se encontraron registros en el catálogo.
            </td>
          </tr>
          <tr v-else v-for="(row, i) in data" :key="row.id || i" class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
              {{ String(row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="emit('edit', row)" 
                class="text-[#0d6efd] dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mr-4 font-semibold hover:underline cursor-pointer"
              >
                Editar
              </button>
              <button 
                @click="emit('delete', row)" 
                class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold hover:underline cursor-pointer"
              >
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
