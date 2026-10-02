<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useItseList, useEliminarItse } from '../../application/composables/useItse';

const { data, isLoading } = useItseList();
const eliminar = useEliminarItse();

const handleAdd = () => alert('Abrir modal de creación para Itse');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {
  eliminar.mutate(item.id, {
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  });
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'numeroCertificado', label: 'NUMEROCERTIFICADO' },
    { key: 'fechaInspeccion', label: 'FECHAINSPECCION' },
    { key: 'nivelRiesgo', label: 'NIVELRIESGO' },
    { key: 'resultado', label: 'RESULTADO' },
    { key: 'inspectorId', label: 'INSPECTORID' }
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
      title="Control de Inspecciones Técnicas de Seguridad (ITSE)"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
