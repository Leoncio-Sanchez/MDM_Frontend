<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useTiposProcedimientoTupaList, useEliminarTiposProcedimientoTupa } from '../../application/composables/useTiposProcedimientoTupa';

const { data, isLoading } = useTiposProcedimientoTupaList();
const eliminar = useEliminarTiposProcedimientoTupa();

const handleAdd = () => alert('Abrir modal de creación para TiposProcedimientoTupa');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {
  eliminar.mutate(item.id, {
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  });
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'codigo', label: 'CODIGO' },
    { key: 'nombre', label: 'NOMBRE' },
    { key: 'costo', label: 'COSTO' },
    { key: 'diasResolucion', label: 'DIASRESOLUCION' }
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
      title="Catálogo Oficial de Procedimientos Administrativos TUPA"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
