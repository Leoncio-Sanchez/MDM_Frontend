<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';
import { useTiposProcedimientoTupaList, useEliminarTiposProcedimientoTupa } from '../../application/composables/useTiposProcedimientoTupa';

const { data, isLoading } = useTiposProcedimientoTupaList();
const eliminar = useEliminarTiposProcedimientoTupa();

const toast = useToast();
const dialog = useDialog();

// TODO: formulario pendiente (ver _docs/CHECKLIST_PENDIENTES.md)
const handleAdd = () => toast.info('El formulario de creación de Procedimientos TUPA aún no está disponible.', 'En construcción');
const handleEdit = (_item: any) => toast.info('El formulario de edición de Procedimientos TUPA aún no está disponible.', 'En construcción');
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
    { key: 'codigo', label: 'CODIGO' },
    { key: 'nombre', label: 'NOMBRE' },
    { key: 'costo', label: 'COSTO' },
    { key: 'diasResolucion', label: 'DIASRESOLUCION' }
  ];

const getDisplayData = () => data.value ?? [];
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
