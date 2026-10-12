<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useNivelesRiesgoList,
  useCrearNivelesRiesgo,
  useActualizarNivelesRiesgo,
  useEliminarNivelesRiesgo,
} from '../../application/composables/useNivelesRiesgo';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';

const { data, isLoading, error } = useNivelesRiesgoList();
const crearNivel = useCrearNivelesRiesgo();
const actualizarNivel = useActualizarNivelesRiesgo();
const eliminar = useEliminarNivelesRiesgo();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'nivel_riesgo',
  initialData: {
    codigo: '',
    nombre: '',
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crearNivel.isPending.value || actualizarNivel.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'codigo', label: 'CÓDIGO' },
  { key: 'nombre', label: 'NIVEL DE RIESGO' },
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
    codigo: item.codigo || '',
    nombre: item.nombre || '',
    esta_activo: Boolean(item.esta_activo),
  });
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar el nivel de riesgo "${item.nombre}" (${item.codigo})?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.codigo.trim()) {
    formError.value = 'El código del nivel de riesgo es obligatorio (ej. NRB, NRM, NRA, NRMA)';
    return;
  }
  if (!form.value.nombre.trim()) {
    formError.value = 'El nombre de la clasificación de riesgo es obligatorio';
    return;
  }

  const payload = {
    codigo: form.value.codigo.trim().toUpperCase(),
    nombre: form.value.nombre.trim().toUpperCase(),
    esta_activo: Boolean(form.value.esta_activo),
  };

  if (isEditMode.value && editingId.value) {
    actualizarNivel.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar nivel de riesgo';
        },
      }
    );
  } else {
    crearNivel.mutate(
      payload,
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('El registro se creó correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al crear nivel de riesgo';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar matriz de riesgo: {{ error.message }}
    </div>

    <CrudTable 
      title="Matriz de Clasificación de Niveles de Riesgo ITSE"
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
      :title="isEditMode ? 'Editar Nivel de Riesgo ITSE' : 'Nuevo Nivel de Riesgo ITSE'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Complete la información para la matriz de evaluación técnica de seguridad'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Nivel' : 'Guardar Nivel'"
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
        <!-- Código del Nivel de Riesgo -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Código Técnico de Riesgo <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.codigo"
            type="text"
            placeholder="Ej. NRB (Bajo), NRM (Medio), NRA (Alto), NRMA (Muy Alto)"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all uppercase font-semibold tracking-wide text-neutral-800 dark:text-neutral-200"
          />
          <p class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Sigla oficial estipulada en el Manual de Ejecución de ITSE (CENEPRED / D.S. 002-2018-PCM).
          </p>
        </div>

        <!-- Nombre / Clasificación -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Denominación del Nivel de Riesgo <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej. RIESGO BAJO, RIESGO MEDIO, RIESGO ALTO, RIESGO MUY ALTO"
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
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Nivel de Riesgo Habilitado</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Permite ser seleccionado en inspecciones técnicas y licencias de funcionamiento</span>
            </div>
          </label>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
