<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { CONTRASENA_MINIMA, cumpleContrasena, MENSAJE_CONTRASENA } from '../utils/contrasena';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import ModalShell from '../components/molecules/ModalShell.vue';
import {
  useUsuariosList,
  useCrearUsuarios,
  useActualizarUsuarios,
  useEliminarUsuarios,
} from '../../application/composables/useUsuarios';
import { useFormDraft } from '../../application/composables/useFormDraft';
import { httpClient } from '../../infrastructure/http/axios.client';
import { useToast, extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import { useRouter } from 'vue-router';

const { data, isLoading } = useUsuariosList();
const crear = useCrearUsuarios();
const actualizar = useActualizarUsuarios();
const eliminar = useEliminarUsuarios();
const toast = useToast();
const authStore = useAuthStore();
const router = useRouter();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const changePassword = ref(false);

// Modal de confirmación para eliminar/desactivar
const isDeleteModalOpen = ref(false);
const userToDelete = ref<any | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'usuario_form_draft',
  initialData: {
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
    is_active: true,
    is_staff: true,
    expedientes: false,
    licencias: false,
    itse: false,
    admin: false,
    es_inspector: false,
    es_jefe_itse: false,
    reportes_completos: false,
  },
});

/** Funciones especiales del perfil (acordadas con el equipo) */
const funcionesEspeciales = [
  { clave: 'es_inspector', titulo: 'Inspector de campo', detalle: 'Solo ve y llena los locales que se le asignan (portal del inspector).' },
  { clave: 'es_jefe_itse', titulo: 'Jefe de ITSE', detalle: 'Asigna inspectores y administra sus cuentas. Requiere "Inspecciones ITSE".' },
  { clave: 'reportes_completos', titulo: 'Reportes completos', detalle: 'Solo lectura y descarga de todos los reportes (Subgerente, Auditor).' },
] as const;
type FuncionEspecial = (typeof funcionesEspeciales)[number]['clave'];

// El jefe de ITSE trabaja dentro de ITSE (el servidor también lo exige)
const funcionBloqueada = (clave: FuncionEspecial) => clave === 'es_jefe_itse' && !form.value.itse;
const alternarFuncion = (clave: FuncionEspecial) => {
  if (!funcionBloqueada(clave)) form.value[clave] = !form.value[clave];
};
watch(
  () => form.value.itse,
  (itse) => {
    if (!itse) form.value.es_jefe_itse = false;
  },
);

const isSubmitting = computed(() => crear.isPending.value || actualizar.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'USUARIO' },
  { key: 'nombre_completo', label: 'NOMBRES Y APELLIDOS' },
  { key: 'email', label: 'CORREO' },
  { key: 'rol', label: 'ROL' },
  { key: 'permisos_resumen', label: 'PERMISOS ASIGNADOS' },
  { key: 'estado', label: 'ESTADO' },
];

const usuariosList = computed(() => {
  if (Array.isArray(data.value)) return data.value;
  return (data.value as any)?.results ?? [];
});

const displayData = computed(() => {
  return usuariosList.value.map((u: any) => {
    const fullName = u.nombre_completo || `${u.first_name || ''} ${u.last_name || ''}`.trim() || '—';
    
    let rolLabel = 'Ciudadano';
    if (u.is_superuser) {
      rolLabel = 'Superadministrador';
    } else if (u.is_staff) {
      rolLabel = 'Personal Municipal';
    }

    let permisos = 'Sin permisos';
    if (u.is_superuser) {
      permisos = 'Acceso Total (Superadmin)';
    } else if (u.perfil) {
      const active: string[] = [];
      if (u.perfil.expedientes) active.push('Expedientes');
      if (u.perfil.licencias) active.push('Licencias');
      if (u.perfil.itse) active.push('ITSE');
      if (u.perfil.admin) active.push('Catálogos / Admin');
      if (u.perfil.es_jefe_itse) active.push('Jefe ITSE');
      if (u.perfil.es_inspector) active.push('Inspector');
      if (u.perfil.reportes_completos) active.push('Reportes completos');
      permisos = active.length > 0 ? active.join(', ') : 'Ninguno';
    }

    return {
      id: u.id,
      username: u.username,
      nombre_completo: fullName,
      email: u.email || '—',
      rol: rolLabel,
      permisos_resumen: permisos,
      estado: u.is_active ? 'Activo' : 'Inactivo',
      raw: u,
    };
  });
});

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  formError.value = null;
  changePassword.value = false;
  loadDraft();
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  const raw = item.raw || item;
  isEditMode.value = true;
  editingId.value = raw.id;
  formError.value = null;
  changePassword.value = false;

  const perfil = raw.perfil || {};

  setFormData({
    username: raw.username || '',
    first_name: raw.first_name || '',
    last_name: raw.last_name || '',
    email: raw.email || '',
    password: '',
    password_confirm: '',
    is_active: raw.is_active !== undefined ? !!raw.is_active : true,
    is_staff: raw.is_staff !== undefined ? !!raw.is_staff : true,
    expedientes: !!perfil.expedientes,
    licencias: !!perfil.licencias,
    itse: !!perfil.itse,
    admin: !!perfil.admin,
    es_inspector: !!perfil.es_inspector,
    es_jefe_itse: !!perfil.es_jefe_itse,
    reportes_completos: !!perfil.reportes_completos,
  });

  isModalOpen.value = true;
};

const handleDelete = (item: any) => {
  userToDelete.value = item.raw || item;
  isDeleteModalOpen.value = true;
};

const confirmDelete = () => {
  if (!userToDelete.value) return;

  eliminar.mutate(userToDelete.value.id, {
    onSuccess: () => {
      toast.success(`El usuario @${userToDelete.value?.username} fue desactivado.`);
      isDeleteModalOpen.value = false;
      userToDelete.value = null;
    },
    onError: (err: any) => {
      toast.error(extractErrorMessage(err), 'No se pudo desactivar el usuario');
    }
  });
};

const handleSubmit = async () => {
  formError.value = null;

  if (!form.value.username?.trim()) {
    formError.value = 'El nombre de usuario es obligatorio.';
    return;
  }

  if (!isEditMode.value) {
    if (!cumpleContrasena(form.value.password)) {
      formError.value = MENSAJE_CONTRASENA;
      return;
    }
    if (form.value.password !== form.value.password_confirm) {
      formError.value = 'Las contraseñas no coinciden.';
      return;
    }
  } else if (changePassword.value) {
    if (!cumpleContrasena(form.value.password)) {
      formError.value = MENSAJE_CONTRASENA;
      return;
    }
    if (form.value.password !== form.value.password_confirm) {
      formError.value = 'Las contraseñas no coinciden.';
      return;
    }
  }

  const payload: any = {
    first_name: form.value.first_name?.trim() || '',
    last_name: form.value.last_name?.trim() || '',
    email: form.value.email?.trim() || '',
    is_active: !!form.value.is_active,
    is_staff: !!form.value.is_staff,
    perfil: {
      expedientes: !!form.value.expedientes,
      licencias: !!form.value.licencias,
      itse: !!form.value.itse,
      admin: !!form.value.admin,
      es_inspector: !!form.value.es_inspector,
      es_jefe_itse: !!form.value.itse && !!form.value.es_jefe_itse,
      reportes_completos: !!form.value.reportes_completos,
    },
  };

  if (!isEditMode.value) {
    payload.username = form.value.username.trim().toLowerCase();
    payload.password = form.value.password;

    crear.mutate(payload, {
      onSuccess: () => {
        toast.success('El usuario se creó correctamente.');
        clearDraft();
        isModalOpen.value = false;
      },
      onError: (err: any) => {
        formError.value = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Error al crear usuario.';
      },
    });
  } else if (editingId.value) {
    actualizar.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: async () => {
          // Si editó su propia cuenta, el menú refleja sus nuevos accesos al instante
          if (Number(editingId.value) === Number(authStore.user?.id)) {
            await authStore.refrescarUsuario().catch(() => undefined);
            if (!authStore.puede(['admin'])) router.push('/admin');
          }
          if (changePassword.value && form.value.password) {
            try {
              await httpClient.patch(`/lf-itse/usuarios/${editingId.value}/cambiar-password`, {
                password: form.value.password,
                password_confirm: form.value.password_confirm,
              });
            } catch (pErr: any) {
              toast.warning(
                'Los datos se guardaron, pero la contraseña no se pudo actualizar: ' + extractErrorMessage(pErr),
                'Guardado parcial',
              );
              clearDraft();
              isModalOpen.value = false;
              return;
            }
          }
          toast.success('Los cambios se guardaron correctamente.');
          clearDraft();
          isModalOpen.value = false;
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.error || err?.response?.data?.detail || err?.message || 'Error al actualizar usuario.';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Tabla Principal con Listado de Usuarios -->
    <CrudTable 
      title="Gestión de Cuentas de Usuario y Permisos"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal Grande de Creación y Edición de Usuario -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Usuario y Permisos' : 'Nuevo Usuario del Sistema'"
      :subtitle="isEditMode ? `Actualizando cuenta de ${form.username} (ID: ${editingId})` : 'Cree un nuevo usuario institucional y configure sus permisos funcionales'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Crear Usuario'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <!-- Alerta de Error -->
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-medium rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <!-- Sección 1: Datos de la Cuenta -->
      <div class="space-y-3">
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            Información de la Cuenta
          </h4>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Nombre de Usuario -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Username / Identificador <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.username"
              type="text"
              required
              :disabled="isEditMode"
              placeholder="Ej. jrodriguez"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 disabled:opacity-60 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 transition-all font-mono"
            />
            <p v-if="isEditMode" class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">El username es único e inmutable.</p>
          </div>

          <!-- Correo Electrónico -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <input
              v-model="form.email"
              type="email"
              placeholder="ejemplo@muni.gob.pe"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
            />
          </div>

          <!-- Nombres -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Nombres
            </label>
            <input
              v-model="form.first_name"
              type="text"
              placeholder="Nombres del usuario"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
            />
          </div>

          <!-- Apellidos -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Apellidos
            </label>
            <input
              v-model="form.last_name"
              type="text"
              placeholder="Apellidos del usuario"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Sección 2: Seguridad y Contraseña -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Seguridad y Contraseña
            </h4>
          </div>

          <!-- Toggle para cambiar clave en edición -->
          <button
            v-if="isEditMode"
            type="button"
            @click="changePassword = !changePassword"
            class="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
          >
            {{ changePassword ? '✕ Cancelar cambio de clave' : '✎ Cambiar contraseña' }}
          </button>
        </div>

        <div v-if="!isEditMode || changePassword" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              {{ isEditMode ? 'Nueva Contraseña' : 'Contraseña' }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.password"
              type="password"
              :placeholder="`Mínimo ${CONTRASENA_MINIMA} caracteres`"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Confirmar Contraseña <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.password_confirm"
              type="password"
              placeholder="Repita la contraseña"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
            />
          </div>
        </div>
        <p v-else class="text-xs text-neutral-500 dark:text-neutral-400 italic">
          La contraseña se mantendrá sin cambios. Presione "Cambiar contraseña" para renovarla.
        </p>
      </div>

      <!-- Sección 3: Roles y Estado de Cuenta -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
            Estado de Acceso
          </h4>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Switch Activo -->
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
            <input 
              v-model="form.is_active" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Usuario Activo</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Permite autenticarse en el sistema.</p>
            </div>
          </label>

          <!-- Switch Personal Municipal -->
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
            <input 
              v-model="form.is_staff" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Personal Municipal (Staff)</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Otorga rol administrativo municipal.</p>
            </div>
          </label>
        </div>
      </div>

      <!-- Sección 4: Matriz de Permisos por Módulo -->
      <div class="space-y-3 pt-2">
        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h4 class="text-xs font-bold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">
              Permisos del Perfil Operativo
            </h4>
          </div>
          <span class="text-[11px] text-neutral-500 dark:text-neutral-400">Configura el acceso a las opciones del menú</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <!-- Permiso 1: Expedientes TUPA -->
          <div 
            @click="form.expedientes = !form.expedientes"
            :class="[
              'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
              form.expedientes 
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' 
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            ]"
          >
            <input 
              v-model="form.expedientes" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Expedientes TUPA</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Recepción, trámites y derivación de expedientes.</p>
            </div>
          </div>

          <!-- Permiso 2: Licencias de Funcionamiento -->
          <div 
            @click="form.licencias = !form.licencias"
            :class="[
              'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
              form.licencias 
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' 
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            ]"
          >
            <input 
              v-model="form.licencias" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Licencias de Funcionamiento</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Evaluación, resoluciones y emisión de certificados LF.</p>
            </div>
          </div>

          <!-- Permiso 3: ITSE -->
          <div 
            @click="form.itse = !form.itse"
            :class="[
              'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
              form.itse 
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' 
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            ]"
          >
            <input 
              v-model="form.itse" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Inspecciones ITSE</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Inspecciones técnicas y emisión de certificados ITSE.</p>
            </div>
          </div>

          <!-- Permiso 4: Administración y Catálogos -->
          <div 
            @click="form.admin = !form.admin"
            :class="[
              'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
              form.admin 
                ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' 
                : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
            ]"
          >
            <input 
              v-model="form.admin" 
              type="checkbox" 
              class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 mt-0.5 pointer-events-none"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">Catálogos y Usuarios</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Acceso a catálogos maestros y gestión de usuarios.</p>
            </div>
          </div>
        </div>

        <!-- Funciones especiales -->
        <h5 class="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider pt-2">Funciones especiales</h5>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div
            v-for="f in funcionesEspeciales"
            :key="f.clave"
            role="checkbox"
            :aria-checked="form[f.clave]"
            :aria-disabled="funcionBloqueada(f.clave)"
            tabindex="0"
            :class="[
              'p-3 rounded-xl border text-left transition-all flex items-start gap-3',
              funcionBloqueada(f.clave)
                ? 'opacity-50 cursor-not-allowed border-neutral-200 dark:border-neutral-800'
                : form[f.clave]
                  ? 'cursor-pointer bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                  : 'cursor-pointer border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
            ]"
            @click="alternarFuncion(f.clave)"
            @keydown.space.prevent="alternarFuncion(f.clave)"
          >
            <input
              :checked="form[f.clave]"
              type="checkbox"
              tabindex="-1"
              :disabled="funcionBloqueada(f.clave)"
              class="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 mt-0.5 pointer-events-none"
            />
            <div>
              <p class="text-xs font-bold text-neutral-800 dark:text-neutral-200">{{ f.titulo }}</p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400">{{ f.detalle }}</p>
            </div>
          </div>
        </div>
      </div>
    </LargeModal>

    <!-- Modal de Confirmación para Desactivar / Eliminar Usuario -->
    <ModalShell :open="isDeleteModalOpen" max-width="max-w-md" layer="dialog" labelledby="delete-user-title">
      <div class="relative w-full bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 space-y-4 select-none">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 shrink-0">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h3 id="delete-user-title" class="text-base font-bold text-neutral-900 dark:text-white">Desactivar Usuario</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Confirmación de seguridad</p>
            </div>
          </div>

          <p class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
            ¿Está seguro de que desea desactivar al usuario 
            <span class="font-bold text-neutral-900 dark:text-white font-mono">@{{ userToDelete?.username }}</span>? 
            Esta acción impedirá que el usuario inicie sesión en el sistema.
          </p>

          <div class="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              @click="isDeleteModalOpen = false"
              class="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              @click="confirmDelete"
              :disabled="eliminar.isPending.value"
              class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <span v-if="eliminar.isPending.value" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ eliminar.isPending.value ? 'Desactivando...' : 'Confirmar Desactivación' }}</span>
            </button>
          </div>
        </div>
  </ModalShell>
  </div>
</template>
