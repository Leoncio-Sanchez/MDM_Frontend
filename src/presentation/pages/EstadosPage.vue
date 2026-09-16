<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useEstadosList, useEliminarEstados } from '../../application/composables/useEstados';

const { data, isLoading } = useEstadosList();
const eliminar = useEliminarEstados();

const handleAdd = () => alert('Abrir modal de creación para Estados');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {
  eliminar.mutate(item.id, {
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  });
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nombre', label: 'NOMBRE' },
    { key: 'descripcion', label: 'DESCRIPCION' },
    { key: 'activo', label: 'ACTIVO' }
  ];

const getDisplayData = () => {
  if (data.value && data.value.length > 0) return data.value;
  return [
    { nombre: 'Dato 1', descripcion: 'Dato 2', activo: 'Dato 3', id: 1 },
    { nombre: 'Dato 1', descripcion: 'Dato 2', activo: 'Dato 3', id: 2 }
  ];
};
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 capitalize">Módulo de estados</h1>
      <p class="text-gray-500 mt-2">Gestión integral del dominio de Estados municipal.</p>
    </header>
    
    <CrudTable 
      title="Listado de Registros"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
