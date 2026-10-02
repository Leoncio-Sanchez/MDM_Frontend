<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useEstadosList,
  useCrearEstado,
  useActualizarEstado,
  useEliminarEstado,
} from '../../application/composables/useEstados';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';

const page = ref(1);

const { data, isLoading, error } = useEstadosList(page);
const crearEstado = useCrearEstado();
const actualizarEstado = useActualizarEstado();
const eliminar = useEliminarEstado();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'estado',
  initialData: {
    nombre: '',
    es_para_lf: true,
    es_para_itse: true,
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crearEstado.isPending.value || actualizarEstado.isPending.value);

const items = computed(() => data.value?.results ?? []);
const total = computed(() => data.value?.count ?? 0);
const hasNext = computed(() => data.value?.next !== null);
const hasPrev = computed(() => data.value?.previous !== null);

function nextPage() { if (hasNext.value) page.value++; }
function prevPage() { if (hasPrev.value && page.value > 1) page.value--; }

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'nombre', label: 'NOMBRE' },
  { key: 'es_para_lf', label: 'ES PARA LF' },
  { key: 'es_para_itse', label: 'ES PARA ITSE' },
  { key: 'esta_activo', label: 'ACTIVO' }
];

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
    nombre: item.nombre || '',
    es_para_lf: Boolean(item.es_para_lf),
    es_para_itse: Boolean(item.es_para_itse),
    esta_activo: Boolean(item.esta_activo),
  });
  isModalOpen.value = true;
};

const handleDelete = (item: any) => {
  if (confirm(`¿Está seguro de eliminar el estado "${item.nombre}"?`)) {
    eliminar.mutate(item.id);
  }
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.nombre.trim()) {
    formError.value = 'El nombre del estado es obligatorio';
    return;
  }

  if (isEditMode.value && editingId.value) {
    actualizarEstado.mutate(
      {
        id: editingId.value,
        data: {
          nombre: form.value.nombre.trim(),
          es_para_lf: form.value.es_para_lf,
          es_para_itse: form.value.es_para_itse,
          esta_activo: form.value.esta_activo,
        },
      },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar el estado';
        },
      }
    );
  } else {
    crearEstado.mutate(
      {
        nombre: form.value.nombre.trim(),
        es_para_lf: form.value.es_para_lf,
        es_para_itse: form.value.es_para_itse,
        esta_activo: form.value.esta_activo,
      },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al crear el estado';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 font-semibold mb-4 bg-red-50 border border-red-200 rounded-xl">
      Error: {{ error.message }}
    </div>

    <CrudTable
      title="Catálogo de Estados del Sistema"
      :columns="columns"
      :data="items"
      :is-loading="isLoading"
      :total="total"
      :has-next="hasNext"
      :has-prev="hasPrev"
      @next-page="nextPage"
      @prev-page="prevPage"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal Grande de Creación / Edición con Persistencia de Borrador -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Estado del Sistema' : 'Nuevo Estado del Sistema'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Complete la información para registrar un nuevo estado de trámite'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Estado' : 'Registrar Estado'"
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
        <!-- Campo: Nombre del Estado -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
            Nombre del Estado <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej. En Evaluación, Vigente, Revocada"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white transition-all"
          />
        </div>

        <!-- Opciones de Aplicación y Activación -->
        <div class="pt-2 border-t border-neutral-100 space-y-3">
          <span class="block text-xs font-bold text-neutral-500 uppercase tracking-wider">
            Ámbito de Aplicación
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Es para LF -->
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-[#f4f4f4]/60 hover:bg-[#f4f4f4] cursor-pointer transition-colors">
              <input
                v-model="form.es_para_lf"
                type="checkbox"
                class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-neutral-800">Aplica a Licencias (LF)</span>
            </label>

            <!-- Es para ITSE -->
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-[#f4f4f4]/60 hover:bg-[#f4f4f4] cursor-pointer transition-colors">
              <input
                v-model="form.es_para_itse"
                type="checkbox"
                class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-neutral-800">Aplica a Inspecciones (ITSE)</span>
            </label>
          </div>

          <!-- Estado Activo -->
          <div class="pt-2">
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 bg-[#f4f4f4]/60 hover:bg-[#f4f4f4] cursor-pointer transition-colors">
              <input
                v-model="form.esta_activo"
                type="checkbox"
                class="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500"
              />
              <span class="text-xs font-medium text-neutral-800">Estado Habilitado / Activo en el Sistema</span>
            </label>
          </div>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
