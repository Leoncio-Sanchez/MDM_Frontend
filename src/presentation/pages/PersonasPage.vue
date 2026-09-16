<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { usePersonasList, useEliminarPersonas } from '../../application/composables/usePersonas';

const { data, isLoading } = usePersonasList();
const eliminar = useEliminarPersonas();

const handleAdd = () => alert('Abrir modal de creación para Personas');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {
  eliminar.mutate(item.id, {
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  });
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'tipoDocumento', label: 'TIPODOCUMENTO' },
    { key: 'numeroDocumento', label: 'NUMERODOCUMENTO' },
    { key: 'nombres', label: 'NOMBRES' },
    { key: 'apellidos', label: 'APELLIDOS' },
    { key: 'razonSocial', label: 'RAZONSOCIAL' }
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
      <h1 class="text-3xl font-bold text-gray-900 capitalize">Módulo de personas</h1>
      <p class="text-gray-500 mt-2">Gestión integral del dominio de Personas municipal.</p>
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
