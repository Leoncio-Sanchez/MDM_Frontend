<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useTiposLicenciaList,
  useCrearTiposLicencia,
  useActualizarTiposLicencia,
  useEliminarTiposLicencia,
} from '../../application/composables/useTiposLicencia';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';

const { data, isLoading, error } = useTiposLicenciaList();
const crearTipo = useCrearTiposLicencia();
const actualizarTipo = useActualizarTiposLicencia();
const eliminar = useEliminarTiposLicencia();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'tipo_licencia',
  initialData: {
    codigo: '',
    nombre: '',
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crearTipo.isPending.value || actualizarTipo.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'codigo', label: 'CÓDIGO' },
  { key: 'nombre', label: 'MODALIDAD / TIPO' },
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

const handleDelete = (item: any) => {
  if (confirm(`¿Está seguro de eliminar el tipo de licencia "${item.nombre}" (${item.codigo})?`)) {
    eliminar.mutate(item.id, {
      onError: (err: any) => alert('Error al eliminar: ' + (err?.response?.data?.message || err.message))
    });
  }
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.codigo.trim()) {
    formError.value = 'El código de la modalidad de licencia es obligatorio (ej. EST, CES, COR)';
    return;
  }
  if (!form.value.nombre.trim()) {
    formError.value = 'El nombre de la modalidad es obligatorio';
    return;
  }

  const payload = {
    codigo: form.value.codigo.trim().toUpperCase(),
    nombre: form.value.nombre.trim().toUpperCase(),
    esta_activo: Boolean(form.value.esta_activo),
  };

  if (isEditMode.value && editingId.value) {
    actualizarTipo.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar tipo de licencia';
        },
      }
    );
  } else {
    crearTipo.mutate(
      payload,
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al crear tipo de licencia';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 font-semibold mb-4 bg-red-50 border border-red-200 rounded-xl">
      Error al cargar tipos de licencia: {{ error.message }}
    </div>

    <CrudTable 
      title="Modalidades y Tipos de Licencias Municipales"
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
      :title="isEditMode ? 'Editar Modalidad de Licencia' : 'Nueva Modalidad de Licencia'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Defina los parámetros normativos para la modalidad de licencia'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Modalidad' : 'Guardar Modalidad'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <!-- Alerta de Error de Validación -->
      <div v-if="formError" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4">
        <!-- Código del Tipo de Licencia -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Código Abreviado <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.codigo"
            type="text"
            placeholder="Ej. EST, CES, COR, TEM"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white transition-all uppercase font-semibold tracking-wide"
          />
        </div>

        <!-- Nombre / Modalidad -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Nombre de la Modalidad <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej. ESTÁNDAR, CESIONARIOS, CORPORATIVA"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white transition-all uppercase"
          />
        </div>

        <!-- Estado Activo -->
        <div class="pt-2 border-t border-neutral-100">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-[#f4f4f4]/60 hover:bg-[#f4f4f4] cursor-pointer transition-colors">
            <input
              v-model="form.esta_activo"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
            />
            <div>
              <span class="text-xs font-semibold text-neutral-800 block">Modalidad Habilitada</span>
              <span class="text-[11px] text-neutral-500 block">Disponible para selección en nuevas licencias de funcionamiento</span>
            </div>
          </label>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
