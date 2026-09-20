<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useEstadosList,
  useCrearEstado,
  useEliminarEstado,
} from '../../application/composables/useEstados';
import CrudTable from '../components/organisms/CrudTable.vue';

const page = ref(1);

const { data, isLoading, error } = useEstadosList(page);
const crear = useCrearEstado();
const eliminar = useEliminarEstado();

// ✅ Real: desempaca results
const items = computed(() => data.value?.results ?? []);
const total = computed(() => data.value?.count ?? 0);
const hasNext = computed(() => data.value?.next !== null);
const hasPrev = computed(() => data.value?.previous !== null);

function nextPage() { if (hasNext.value) page.value++; }
function prevPage() { if (hasPrev.value && page.value > 1) page.value--; }

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'NOMBRE' },
  { key: 'es_para_lf', label: 'ES PARA LF' },
  { key: 'es_para_itse', label: 'ES PARA ITSE' },
  { key: 'esta_activo', label: 'ACTIVO' }
];

const handleAdd = () => alert('Abrir modal de creación');
const handleEdit = (item: any) => alert('Abrir modal de edición');
const handleDelete = (item: any) => eliminar.mutate(item.id);
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 capitalize">Módulo de estados</h1>
      <p class="text-gray-500 mt-2">Gestión integral del dominio de Estados municipal.</p>
    </header>

    <div v-if="error" class="p-6 text-center text-red-600 font-bold mb-4 bg-red-50 rounded-lg">
      Error: {{ error.message }}
    </div>

    <CrudTable
      title="Estados"
      :columns="columns"
      :data="items"
      :is-loading="isLoading"
      :total="total"
      :has-next="hasNext"
      :has-prev="hasPrev"
      @next-page="nextPage"
      @prev-page="prevPage"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
