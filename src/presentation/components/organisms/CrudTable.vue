<script setup lang="ts">
import { toRef } from 'vue';
import Button from '../atoms/Button.vue';
import Skeleton from '../atoms/Skeleton.vue';
import Paginacion from '../molecules/Paginacion.vue';
import { usePaginacion } from '../../../application/composables/usePaginacion';

interface Column {
  key: string;
  label: string;
}

interface Props {
  title: string;
  columns: Column[];
  data: any[];
  isLoading?: boolean;
  /** Texto del botón de borrado (p. ej. "Inactivar" en módulos que no eliminan registros) */
  deleteLabel?: string;
  /** Filas de esqueleto mientras carga */
  skeletonRows?: number;
  /** Filas por página al abrir la pantalla */
  pageSize?: number;
  /** Solo consulta: sin "Nuevo Registro" ni acciones de Editar / Eliminar */
  soloLectura?: boolean;
  /** Mensaje cuando no hay registros */
  textoVacio?: string;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  deleteLabel: 'Eliminar',
  skeletonRows: 5,
  pageSize: 10,
  soloLectura: false,
  textoVacio: 'No se encontraron registros en el catálogo.',
});

// La lista llega completa del servidor: se pagina aquí para todas las pantallas
const { pagina, tamano, total, totalPaginas, desde, hasta, itemsPagina } = usePaginacion(toRef(props, 'data'), props.pageSize);

// Anchos variados para que el esqueleto parezca texto real y no una grilla uniforme
const SKELETON_WIDTHS = ['w-10', 'w-24', 'w-32', 'w-20', 'w-40', 'w-16', 'w-28'];
const skeletonWidth = (row: number, col: number) => SKELETON_WIDTHS[(row * 3 + col) % SKELETON_WIDTHS.length];

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
      <Button v-if="!soloLectura" variant="primary" @click="emit('add')" class="shadow-xs cursor-pointer">+ Nuevo Registro</Button>
      <slot name="acciones-encabezado" />
    </div>
    
    <div class="overflow-x-auto">
      <span v-if="isLoading" role="status" class="sr-only">Cargando registros…</span>
      <table :aria-busy="isLoading" class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
        <thead class="bg-neutral-100/75 dark:bg-neutral-800/60">
          <tr>
            <th v-for="col in columns" :key="col.key" class="px-6 py-3.5 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              {{ col.label }}
            </th>
            <th v-if="!soloLectura" class="px-6 py-3.5 text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-[#18181b] divide-y divide-neutral-200 dark:divide-neutral-800/80 transition-colors">
          <template v-if="isLoading">
            <tr v-for="r in skeletonRows" :key="`sk-${r}`">
              <td v-for="(col, c) in columns" :key="col.key" class="px-6 py-4">
                <Skeleton :class="['h-4', skeletonWidth(r, c)]" />
              </td>
              <td v-if="!soloLectura" class="px-6 py-4">
                <div class="flex justify-end gap-4">
                  <Skeleton class="h-4 w-10" />
                  <Skeleton class="h-4 w-14" />
                </div>
              </td>
            </tr>
          </template>
          <tr v-else-if="data.length === 0">
            <td :colspan="columns.length + (soloLectura ? 0 : 1)" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
              {{ textoVacio }}
            </td>
          </tr>
          <tr v-else v-for="(row, i) in itemsPagina" :key="row.id || i" class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
            <td v-for="col in columns" :key="col.key" class="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
              {{ String(row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : '') }}
            </td>
            <td v-if="!soloLectura" class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                {{ deleteLabel }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Paginacion
      v-if="!isLoading"
      v-model:pagina="pagina"
      v-model:tamano="tamano"
      :total-paginas="totalPaginas"
      :total="total"
      :desde="desde"
      :hasta="hasta"
    />
  </div>
</template>
