<script setup lang="ts">
import { ref, computed } from 'vue';
import { CONTRASENA_MINIMA, cumpleContrasena, MENSAJE_CONTRASENA } from '../utils/contrasena';
import {
  useInspectoresList,
  useCrearInspectores,
  useActualizarInspectores,
  useEliminarInspectores,
} from '../../application/composables/useInspectores';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog, extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';

const { data, isLoading, error } = useInspectoresList();
const crearInspector = useCrearInspectores();
const actualizarInspector = useActualizarInspectores();
const eliminar = useEliminarInspectores();
const toast = useToast();
const dialog = useDialog();
const authStore = useAuthStore();

// Ver: acceso ITSE. Crear, editar y desactivar cuentas de inspectores: solo el jefe de ITSE
const puedeAdministrar = computed(() => authStore.puede(['jefe_itse']));

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'inspector',
  initialData: {
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    is_active: true,
  },
});

const isSubmitting = computed(() => crearInspector.isPending.value || actualizarInspector.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'USUARIO' },
  { key: 'nombre_completo', label: 'NOMBRES Y APELLIDOS' },
  { key: 'email', label: 'CORREO ELECTRÓNICO' },
  { key: 'estado', label: 'ESTADO' }
];

const displayData = computed(() => {
  const list = Array.isArray(data.value) ? data.value : (data.value as any)?.results ?? [];
  return list.map((item: any) => ({
    ...item,
    nombre_completo: (item.first_name || item.last_name) 
      ? `${item.first_name || ''} ${item.last_name || ''}`.trim()
      : (item.username || 'Inspector'),
    // Columna aparte: is_active se mantiene booleano para que Editar muestre el estado real
    estado: item.is_active ? 'ACTIVO' : 'INACTIVO'
  }));
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
    username: item.username || '',
    password: '',
    first_name: item.first_name || '',
    last_name: item.last_name || '',
    email: item.email || '',
    is_active: Boolean(item.is_active),
  });
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirm({
    variant: 'warning',
    title: 'Desactivar inspector',
    confirmText: 'Sí, desactivar',
    text: `¿Desactivar la cuenta de ${item.username}?\nNo podrá iniciar sesión; su historial se conserva y se puede volver a activar editándolo.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('La cuenta del inspector quedó desactivada.');
};

const handleSubmit = () => {
  formError.value = null;
  if (!form.value.username.trim()) {
    formError.value = 'El nombre de usuario es obligatorio';
    return;
  }
  if (!isEditMode.value && !form.value.password) {
    formError.value = 'Debe definir una contraseña inicial para el inspector';
    return;
  }
  // En edición, en blanco conserva la contraseña actual
  if (form.value.password && !cumpleContrasena(form.value.password)) {
    formError.value = MENSAJE_CONTRASENA;
    return;
  }

  const payload: any = {
    username: form.value.username.trim(),
    first_name: form.value.first_name.trim(),
    last_name: form.value.last_name.trim(),
    email: form.value.email.trim(),
    is_active: Boolean(form.value.is_active),
  };

  if (form.value.password) {
    payload.password = form.value.password;
  }

  if (isEditMode.value && editingId.value) {
    actualizarInspector.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = extractErrorMessage(err, 'Error al actualizar inspector');
        },
      }
    );
  } else {
    crearInspector.mutate(
      payload,
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('El registro se creó correctamente.');
        },
        onError: (err: any) => {
          formError.value = extractErrorMessage(err, 'Error al registrar inspector');
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar inspectores: {{ error.message }}
    </div>

    <CrudTable 
      title="Padrón Oficial de Inspectores Técnicos Acreditados (ITSE)"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      :solo-lectura="!puedeAdministrar"
      delete-label="Desactivar"
      texto-vacio="Todavía no hay inspectores. El jefe de ITSE puede registrarlos aquí, o administración puede marcar a un usuario como inspector."
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal Grande de Registro / Edición con Persistencia de Borrador -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Inspector Técnico' : 'Acreditar Nuevo Inspector Técnico'"
      :subtitle="isEditMode ? `Modificando registro #${editingId}` : 'Complete las credenciales y datos del profesional técnico evaluador'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Inspector' : 'Registrar Inspector'"
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
        <!-- Usuario y Contraseña -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Usuario de Acceso <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.username"
              type="text"
              placeholder="Ej. inspectoritse_01"
              :disabled="isEditMode"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all font-mono text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Contraseña <span v-if="!isEditMode" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              :placeholder="isEditMode ? `En blanco para no cambiar, o mínimo ${CONTRASENA_MINIMA} caracteres` : `Mínimo ${CONTRASENA_MINIMA} caracteres`"
              :required="!isEditMode"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all font-mono text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <!-- Nombres y Apellidos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Nombres
            </label>
            <input
              v-model="form.first_name"
              type="text"
              placeholder="Ej. Juan Carlos"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Apellidos
            </label>
            <input
              v-model="form.last_name"
              type="text"
              placeholder="Ej. Mendoza Morales"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Correo Electrónico Institucional
          </label>
          <input
            v-model="form.email"
            type="email"
            placeholder="Ej. inspector@muni.gob.pe"
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <!-- Estado Activo -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="w-4 h-4 text-emerald-600 rounded border-neutral-300 dark:border-neutral-700 focus:ring-emerald-500"
            />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Inspector Habilitado en Padrón</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Permite ser asignado a comisiones e inspecciones técnicas de seguridad</span>
            </div>
          </label>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
