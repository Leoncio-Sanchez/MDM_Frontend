<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';
import { useUnidadesOrganicasList, useEliminarUnidadesOrganicas } from '../../application/composables/useUnidadesOrganicas';

const { data, isLoading } = useUnidadesOrganicasList();
const eliminar = useEliminarUnidadesOrganicas();

const toast = useToast();
const dialog = useDialog();

// TODO: formulario pendiente (ver _docs/CHECKLIST_PENDIENTES.md)
const handleAdd = () => toast.info('El formulario de creación de Unidades Orgánicas aún no está disponible.', 'En construcción');
const handleEdit = (_item: any) => toast.info('El formulario de edición de Unidades Orgánicas aún no está disponible.', 'En construcción');
const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar el registro #${item.id}?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
};

const columns = [
    { key: 'id', label: 'ID' },
    { key: 'siglas', label: 'SIGLAS' },
    { key: 'nombre', label: 'NOMBRE' },
    { key: 'responsable', label: 'RESPONSABLE' }
  ];

const getDisplayData = () => data.value ?? [];
</script>

<template>
  <div>
    <CrudTable 
      title="Estructura de Unidades Orgánicas y Subgerencias"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
