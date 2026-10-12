<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useGirosList,
  useCrearGiros,
  useActualizarGiros,
  useEliminarGiros,
} from '../../application/composables/useGiros';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';

const { data, isLoading, error } = useGirosList();
const crearGiro = useCrearGiros();
const actualizarGiro = useActualizarGiros();
const eliminar = useEliminarGiros();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'giro',
  initialData: {
    ciiu_id: '' as string | number,
    nombre: '',
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crearGiro.isPending.value || actualizarGiro.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'ciiu_id', label: 'CIIU' },
  { key: 'nombre', label: 'ACTIVIDAD / GIRO COMERCIAL' },
  { key: 'esta_activo', label: 'ACTIVO' }
];

const displayData = computed(() => {
  if (Array.isArray(data.value)) return data.value;
  return (data.value as any)?.results ?? [];
});

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  formError.value = null;
  loadDraft();
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  isEditMode.value = true;
  editingId.value = item.id;
  formError.value = null;
  setFormData({
    ciiu_id: item.ciiu_id || '',
    nombre: item.nombre || '',
    esta_activo: Boolean(item.esta_activo),
  });
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar el giro comercial "${item.nombre}"?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.nombre.trim()) {
    formError.value = 'El nombre de la actividad o giro es obligatorio';
    return;
  }

  const payload = {
    ciiu_id: form.value.ciiu_id ? Number(form.value.ciiu_id) : null,
    nombre: form.value.nombre.trim().toUpperCase(),
    esta_activo: Boolean(form.value.esta_activo),
  };

  if (isEditMode.value && editingId.value) {
    actualizarGiro.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar el giro comercial';
        },
      }
    );
  } else {
    crearGiro.mutate(
      payload,
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('El registro se creó correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al crear el giro comercial';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar datos: {{ error.message }}
    </div>

    <CrudTable 
      title="Catálogo Oficial de Giros Comerciales (CIIU)"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal Grande de Creación / Edición con Persistencia de Borrador -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Giro Comercial' : 'Nuevo Giro Comercial'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Complete la información para registrar una actividad en el catálogo oficial'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Giro' : 'Guardar Giro'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <!-- Alerta de Error de Validación -->
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4">
        <!-- Código CIIU -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Código CIIU (Clasificación Industrial)
          </label>
          <input
            v-model="form.ciiu_id"
            type="number"
            placeholder="Ej. 1313, 8110, 4711"
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all font-mono text-neutral-800 dark:text-neutral-200"
          />
          <p class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Código numérico normalizado según la clasificación internacional CIIU Rev. 4.
          </p>
        </div>

        <!-- Nombre / Actividad -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Nombre de la Actividad o Giro Comercial <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej. VENTA AL POR MENOR EN COMERCIOS NO ESPECIALIZADOS"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all uppercase text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <!-- Estado Activo -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input
              v-model="form.esta_activo"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 rounded border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500"
            />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Giro Comercial Habilitado</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Disponible para ser asignado en expedientes y licencias</span>
            </div>
          </label>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
