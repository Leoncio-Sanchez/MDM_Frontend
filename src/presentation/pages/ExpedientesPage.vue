<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useExpedientesList, useEliminarExpedientes } from '../../application/composables/useExpedientes';

const { data, isLoading } = useExpedientesList();
const eliminar = useEliminarExpedientes();

const handleAdd = () => alert('Abrir modal de creación para Expedientes');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {
  eliminar.mutate(item.id, {
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  });
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'numero', label: 'NUMERO' },
    { key: 'fechaIngreso', label: 'FECHAINGRESO' },
    { key: 'rucContribuyente', label: 'RUCCONTRIBUYENTE' },
    { key: 'razonSocial', label: 'RAZONSOCIAL' },
    { key: 'estado', label: 'ESTADO' }
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
      <h1 class="text-3xl font-bold text-gray-900 capitalize">Módulo de Expedientes</h1>
      <p class="text-gray-500 mt-2">Gestión integral del dominio de Expedientes municipal.</p>
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
