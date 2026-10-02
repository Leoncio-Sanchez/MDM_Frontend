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
  <div>
    <CrudTable 
      title="Padrón General de Ciudadanos y Personas Jurídicas"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
