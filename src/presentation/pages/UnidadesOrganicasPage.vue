<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useUnidadesOrganicasList,
  useCrearUnidadesOrganicas,
  useActualizarUnidadesOrganicas,
  useEliminarUnidadesOrganicas,
} from '../../application/composables/useUnidadesOrganicas';
import { useTiposProcedimientoTupaList } from '../../application/composables/useTiposProcedimientoTupa';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { UnidadesOrganicas, UnidadOrganicaPayload } from '../../domain/entities/UnidadesOrganicas.entity';
import type { TiposProcedimientoTupa } from '../../domain/entities/TiposProcedimientoTupa.entity';

const { data, isLoading, error } = useUnidadesOrganicasList();
const { data: tupaData } = useTiposProcedimientoTupaList();

const crear = useCrearUnidadesOrganicas();
const actualizar = useActualizarUnidadesOrganicas();
const eliminar = useEliminarUnidadesOrganicas();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

/** Límites de las columnas en BD (ver GuardarUnidadOrganicaRequest) */
const MAX_CODIGO = 20;
const MAX_NOMBRE = 100;
const MAX_SIGLA = 20;

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'unidad_organica',
  initialData: {
    codigo: '',
    sigla: '',
    nombre: '',
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crear.isPending.value || actualizar.isPending.value);

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const unidades = computed(() => listOf<UnidadesOrganicas>(data.value));

/** Cantidad de procedimientos TUPA por unidad (orienta antes de eliminar) */
const procedimientosPorUnidad = computed(() => {
  const conteo = new Map<number, number>();
  for (const t of listOf<TiposProcedimientoTupa>(tupaData.value)) {
    conteo.set(t.unidad_organica, (conteo.get(t.unidad_organica) ?? 0) + 1);
  }
  return conteo;
});

const columns = [
  { key: 'codigo', label: 'CÓDIGO' },
  { key: 'sigla', label: 'SIGLA' },
  { key: 'nombre', label: 'NOMBRE' },
  { key: 'procedimientos', label: 'PROCEDIMIENTOS TUPA' },
  { key: 'estado', label: 'ESTADO' },
];

const displayData = computed(() =>
  unidades.value.map((u) => ({
    id: u.id,
    codigo: u.codigo,
    sigla: u.sigla || '—',
    nombre: u.nombre,
    procedimientos: procedimientosPorUnidad.value.get(u.id) ?? 0,
    estado: u.esta_activo ? 'ACTIVA' : 'INACTIVA',
    raw: u,
  })),
);

const fieldError = (campo: string) => fieldErrors.value[campo];

const resetErrors = () => {
  formError.value = null;
  fieldErrors.value = {};
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetErrors();
  loadDraft();
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  const u: UnidadesOrganicas = item.raw;
  isEditMode.value = true;
  editingId.value = u.id;
  resetErrors();
  setFormData({ codigo: u.codigo, sigla: u.sigla ?? '', nombre: u.nombre, esta_activo: u.esta_activo });
  isModalOpen.value = true;
};

/** Validación en el cliente (espejo de GuardarUnidadOrganicaRequest). Devuelve el primer error o null. */
const validar = (): string | null => {
  const f = form.value;
  if (!f.codigo.trim()) return 'Ingrese el código de la unidad.';
  if (f.codigo.trim().length > MAX_CODIGO) return `El código no puede superar ${MAX_CODIGO} caracteres.`;
  if (!f.nombre.trim()) return 'Ingrese el nombre de la unidad.';
  if (f.nombre.trim().length > MAX_NOMBRE) return `El nombre no puede superar ${MAX_NOMBRE} caracteres.`;
  if (f.sigla.trim().length > MAX_SIGLA) return `La sigla no puede superar ${MAX_SIGLA} caracteres.`;
  return null;
};

const construirPayload = (u: { codigo: string; sigla: string; nombre: string; esta_activo: boolean }): UnidadOrganicaPayload => ({
  codigo: u.codigo.trim().toUpperCase(),
  sigla: u.sigla.trim().toUpperCase() || null,
  nombre: u.nombre.trim().toUpperCase(),
  esta_activo: Boolean(u.esta_activo),
});

const onError = (fallback: string) => (err: any) => {
  fieldErrors.value = extractFieldErrors(err);
  const errores = Object.values(fieldErrors.value);
  // Un solo error de campo se muestra tal cual (el backend lo envía en español)
  formError.value = errores.length === 1 ? errores[0] : errores.length ? 'Revise los campos marcados en rojo.' : extractErrorMessage(err, fallback);
};

const handleSubmit = () => {
  resetErrors();
  const mensaje = validar();
  if (mensaje) {
    formError.value = mensaje;
    return;
  }
  const payload = construirPayload(form.value);

  if (isEditMode.value && editingId.value) {
    actualizar.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios de la unidad se guardaron correctamente.');
        },
        onError: onError('Error al actualizar la unidad orgánica'),
      },
    );
  } else {
    crear.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success(`La unidad ${payload.codigo} se registró correctamente.`);
      },
      onError: onError('Error al registrar la unidad orgánica'),
    });
  }
};

/**
 * Eliminar solo es posible si nada depende de la unidad. Si el backend responde 409
 * (procedimientos TUPA o usuarios asociados), se ofrece desactivarla en su lugar.
 */
const handleDelete = async (item: any) => {
  const u: UnidadesOrganicas = item.raw;
  let mensajeEnUso: string | null = null;

  const ok = await dialog.confirmDelete({
    title: 'Eliminar unidad orgánica',
    text: `¿Eliminar "${u.codigo} · ${u.nombre}"?\nSolo es posible si no tiene procedimientos TUPA asociados.`,
    onConfirm: async () => {
      try {
        await eliminar.mutateAsync(u.id);
      } catch (err: any) {
        if (err?.response?.status === 409) {
          mensajeEnUso = extractErrorMessage(err);
          return; // se cierra este diálogo y se ofrece desactivar
        }
        throw err; // otros errores se muestran dentro del diálogo
      }
    },
  });
  if (!ok) return;

  if (!mensajeEnUso) {
    toast.success(`La unidad ${u.codigo} se eliminó correctamente.`);
    return;
  }
  if (!u.esta_activo) {
    toast.warning(mensajeEnUso, 'No se puede eliminar');
    return;
  }
  const desactivarOk = await dialog.confirm({
    title: 'No se puede eliminar',
    text: `${mensajeEnUso}\n¿Desea desactivarla ahora?`,
    variant: 'warning',
    confirmText: 'Sí, desactivar',
    onConfirm: () =>
      actualizar.mutateAsync({ id: u.id, data: construirPayload({ codigo: u.codigo, sigla: u.sigla ?? '', nombre: u.nombre, esta_activo: false }) }),
  });
  if (desactivarOk) toast.success(`La unidad ${u.codigo} quedó inactiva.`);
};

const labelClass = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all';
const errorInputClass = 'border-red-400 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20';
const hintClass = 'text-[11px] text-neutral-400 dark:text-neutral-500 mt-1';
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar unidades orgánicas: {{ error.message }}
    </div>

    <CrudTable
      title="Estructura de Unidades Orgánicas y Subgerencias"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Unidad Orgánica' : 'Registrar Unidad Orgánica'"
      :subtitle="isEditMode ? `Modificando ${form.codigo}` : 'Gerencia o subgerencia responsable de procedimientos TUPA'"
      maxWidth="max-w-xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Registrar Unidad'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl flex items-center gap-2" role="alert">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label :class="labelClass" for="uo-codigo">Código <span class="text-red-500">*</span></label>
            <input id="uo-codigo" v-model="form.codigo" type="text" :maxlength="MAX_CODIGO" placeholder="Ej. SGLC" :class="[inputClass, 'uppercase font-mono font-bold', fieldError('codigo') ? errorInputClass : '']" />
            <p v-if="fieldError('codigo')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('codigo') }}</p>
          </div>
          <div>
            <label :class="labelClass" for="uo-sigla">Sigla</label>
            <input id="uo-sigla" v-model="form.sigla" type="text" :maxlength="MAX_SIGLA" placeholder="Ej. SGLC" :class="[inputClass, 'uppercase', fieldError('sigla') ? errorInputClass : '']" />
            <p :class="hintClass">Abreviatura que se muestra en tablas y listas.</p>
          </div>
        </div>
        <div>
          <label :class="labelClass" for="uo-nombre">Nombre <span class="text-red-500">*</span></label>
          <input id="uo-nombre" v-model="form.nombre" type="text" :maxlength="MAX_NOMBRE" placeholder="Ej. SUBGERENCIA DE LICENCIAS COMERCIALES" :class="[inputClass, 'uppercase', fieldError('nombre') ? errorInputClass : '']" />
          <p :class="hintClass">{{ form.nombre.length }} / {{ MAX_NOMBRE }} caracteres</p>
        </div>

        <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
          <input v-model="form.esta_activo" type="checkbox" class="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500" />
          <div>
            <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Unidad activa</span>
            <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Si se desactiva, no se ofrece al registrar procedimientos TUPA nuevos</span>
          </div>
        </label>
      </div>
    </LargeModal>
  </div>
</template>
