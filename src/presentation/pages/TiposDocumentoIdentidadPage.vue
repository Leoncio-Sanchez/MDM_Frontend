<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useTiposDocumentoIdentidadList,
  useCrearTiposDocumentoIdentidad,
  useActualizarTiposDocumentoIdentidad,
  useEliminarTiposDocumentoIdentidad,
} from '../../application/composables/useTiposDocumentoIdentidad';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';

const { data, isLoading, error } = useTiposDocumentoIdentidadList();
const crearTipo = useCrearTiposDocumentoIdentidad();
const actualizarTipo = useActualizarTiposDocumentoIdentidad();
const eliminar = useEliminarTiposDocumentoIdentidad();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'tipo_documento_identidad',
  initialData: {
    codigo: '',
    nombre: '',
    esta_activo: true,
    es_para_natural: true,
    es_para_juridica: false,
  },
});

const isSubmitting = computed(() => crearTipo.isPending.value || actualizarTipo.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'codigo', label: 'CÓDIGO' },
  { key: 'nombre', label: 'TIPO DE DOCUMENTO' },
  { key: 'es_para_natural', label: 'PERSONA NATURAL' },
  { key: 'es_para_juridica', label: 'PERSONA JURÍDICA' },
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
    es_para_natural: Boolean(item.es_para_natural),
    es_para_juridica: Boolean(item.es_para_juridica),
  });
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar el tipo de documento "${item.nombre}" (${item.codigo})?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.codigo.trim()) {
    formError.value = 'El código del documento es obligatorio (ej. 01, 04, 06)';
    return;
  }
  if (!form.value.nombre.trim()) {
    formError.value = 'El nombre del tipo de documento es obligatorio';
    return;
  }
  if (!form.value.es_para_natural && !form.value.es_para_juridica) {
    formError.value = 'Debe seleccionar al menos un ámbito de aplicación (Persona Natural o Jurídica)';
    return;
  }

  const payload = {
    codigo: form.value.codigo.trim().toUpperCase(),
    nombre: form.value.nombre.trim().toUpperCase(),
    esta_activo: Boolean(form.value.esta_activo),
    es_para_natural: Boolean(form.value.es_para_natural),
    es_para_juridica: Boolean(form.value.es_para_juridica),
  };

  if (isEditMode.value && editingId.value) {
    actualizarTipo.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar tipo de documento';
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
          toast.success('El registro se creó correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al registrar tipo de documento';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar tipos de documento: {{ error.message }}
    </div>

    <CrudTable 
      title="Catálogo Oficial de Tipos de Documento de Identidad (SUNAT / RENIEC)"
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
      :title="isEditMode ? 'Editar Tipo de Documento' : 'Nuevo Tipo de Documento'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Complete la información para el catálogo oficial de identidad'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Documento' : 'Guardar Documento'"
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
        <!-- Código SUNAT -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Código Oficial SUNAT / PIDE <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.codigo"
            type="text"
            placeholder="Ej. 01 (DNI), 04 (Carnet Extranjería), 06 (RUC)"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all font-mono font-semibold text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <!-- Nombre / Denominación -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Denominación del Documento <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre"
            type="text"
            placeholder="Ej. DOCUMENTO NACIONAL DE IDENTIDAD, REGISTRO ÚNICO DE CONTRIBUYENTES"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all uppercase text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <!-- Opciones de Aplicación y Activación -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <span class="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
            Tipos de Persona Aplicables
          </span>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Es para Natural -->
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
              <input
                v-model="form.es_para_natural"
                type="checkbox"
                class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 dark:border-neutral-700 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200">Persona Natural</span>
            </label>

            <!-- Es para Jurídica -->
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
              <input
                v-model="form.es_para_juridica"
                type="checkbox"
                class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 dark:border-neutral-700 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200">Persona Jurídica (Empresa)</span>
            </label>
          </div>

          <!-- Estado Activo -->
          <div class="pt-2">
            <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
              <input
                v-model="form.esta_activo"
                type="checkbox"
                class="w-4 h-4 text-emerald-600 rounded border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500"
              />
              <span class="text-xs font-medium text-neutral-800 dark:text-neutral-200">Tipo de Documento Activo en el Sistema</span>
            </label>
          </div>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
