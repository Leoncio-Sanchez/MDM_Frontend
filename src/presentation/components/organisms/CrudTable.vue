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
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div class="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
      <h2 class="text-xl font-bold text-gray-800">{{ title }}</h2>
      <Button variant="primary" @click="emit('add')">+ Nuevo Registro</Button>
    </div>
    
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-100">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              {{ col.label }}
            </th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="isLoading">
            <td :colspan="columns.length + 1" class="px-6 py-10 text-center text-gray-500">
              Cargando datos...
            </td>
          </tr>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + 1" class="px-6 py-10 text-center text-gray-500">
              No hay registros encontrados.
            </td>
          </tr>
          <tr v-else v-for="(row, i) in data" :key="row.id || i" class="hover:bg-gray-50 transition-colors">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
              {{ String(row[col.key] || '') }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="emit('edit', row)" class="text-indigo-600 hover:text-indigo-900 mr-4">Editar</button>
              <button @click="emit('delete', row)" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
