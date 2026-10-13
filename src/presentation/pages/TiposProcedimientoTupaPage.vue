<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useTiposProcedimientoTupaList,
  useCrearTiposProcedimientoTupa,
  useActualizarTiposProcedimientoTupa,
  useEliminarTiposProcedimientoTupa,
} from '../../application/composables/useTiposProcedimientoTupa';
import { useUnidadesOrganicasList } from '../../application/composables/useUnidadesOrganicas';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { TiposProcedimientoTupa, TipoProcedimientoTupaPayload } from '../../domain/entities/TiposProcedimientoTupa.entity';
import type { UnidadesOrganicas } from '../../domain/entities/UnidadesOrganicas.entity';

const { data, isLoading, error } = useTiposProcedimientoTupaList();
const { data: unidadesData } = useUnidadesOrganicasList();

const crear = useCrearTiposProcedimientoTupa();
const actualizar = useActualizarTiposProcedimientoTupa();
const eliminar = useEliminarTiposProcedimientoTupa();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

/** Límites de las columnas en BD (ver CrearTipoProcedimientoTupaRequest) */
const MAX_CODIGO = 30;
const MAX_NOMBRE = 200;

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'tipo_procedimiento_tupa',
  initialData: {
    codigo: '',
    nombre: '',
    unidad_organica_id: '' as string | number,
    plazo_atencion_dias: '' as string | number,
    dias_alerta_vencimiento: '' as string | number,
    requiere_lf: false,
    requiere_itse: false,
    esta_activo: true,
  },
});

const isSubmitting = computed(() => crear.isPending.value || actualizar.isPending.value);

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const procedimientos = computed(() => listOf<TiposProcedimientoTupa>(data.value));
const unidades = computed(() => listOf<UnidadesOrganicas>(unidadesData.value));
// Las unidades inactivas no se ofrecen; se mantiene la que ya tiene el procedimiento en edición
const unidadesActivas = computed(() =>
  unidades.value.filter((u) => u.esta_activo || String(u.id) === String(form.value.unidad_organica_id)),
);
const unidadesById = computed(() => new Map(unidades.value.map((u) => [u.id, u])));

const emite = (p: TiposProcedimientoTupa) =>
  [p.requiere_lf && 'Licencia', p.requiere_itse && 'ITSE'].filter(Boolean).join(' + ') || '—';

const columns = [
  { key: 'codigo', label: 'CÓDIGO' },
  { key: 'nombre', label: 'PROCEDIMIENTO' },
  { key: 'unidad', label: 'UNIDAD' },
  { key: 'plazo', label: 'PLAZO' },
  { key: 'alerta', label: 'ALERTA' },
  { key: 'emite', label: 'EMITE' },
  { key: 'estado', label: 'ESTADO' },
];

const displayData = computed(() =>
  procedimientos.value.map((p) => {
    const unidad = unidadesById.value.get(p.unidad_organica);
    return {
      id: p.id,
      codigo: p.codigo,
      nombre: p.nombre,
      unidad: unidad?.sigla || unidad?.nombre || `#${p.unidad_organica}`,
      plazo: `${p.plazo_atencion_dias} días hábiles`,
      alerta: p.dias_alerta_vencimiento ? `${p.dias_alerta_vencimiento} días antes` : 'Sin alerta',
      emite: emite(p),
      estado: p.esta_activo ? 'ACTIVO' : 'INACTIVO',
      raw: p,
    };
  }),
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
  const p: TiposProcedimientoTupa = item.raw;
  isEditMode.value = true;
  editingId.value = p.id;
  resetErrors();
  setFormData({
    codigo: p.codigo,
    nombre: p.nombre,
    unidad_organica_id: p.unidad_organica,
    plazo_atencion_dias: p.plazo_atencion_dias,
    dias_alerta_vencimiento: p.dias_alerta_vencimiento,
    requiere_lf: p.requiere_lf,
    requiere_itse: p.requiere_itse,
    esta_activo: p.esta_activo,
  });
  isModalOpen.value = true;
};

/** Validación en el cliente (espejo de las reglas del backend). Devuelve el primer error o null. */
const validar = (): string | null => {
  const f = form.value;
  if (!f.codigo.trim()) return 'Ingrese el código del procedimiento.';
  if (f.codigo.trim().length > MAX_CODIGO) return `El código no puede superar ${MAX_CODIGO} caracteres.`;
  if (!f.nombre.trim()) return 'Ingrese el nombre del procedimiento.';
  if (!f.unidad_organica_id) return 'Seleccione la unidad orgánica responsable.';
  const plazo = Number(f.plazo_atencion_dias);
  if (!Number.isInteger(plazo) || plazo < 1) return 'El plazo de atención debe ser de al menos 1 día.';
  const alerta = Number(f.dias_alerta_vencimiento);
  if (f.dias_alerta_vencimiento === '' || !Number.isInteger(alerta) || alerta < 0) return 'Ingrese los días de alerta (0 si no se requiere).';
  if (alerta > plazo) return 'Los días de alerta no pueden superar el plazo de atención.';
  return null;
};

const construirPayload = (): TipoProcedimientoTupaPayload => {
  const f = form.value;
  return {
    codigo: f.codigo.trim().toUpperCase(),
    nombre: f.nombre.trim().toUpperCase(),
    unidad_organica_id: Number(f.unidad_organica_id),
    plazo_atencion_dias: Number(f.plazo_atencion_dias),
    dias_alerta_vencimiento: Number(f.dias_alerta_vencimiento),
    requiere_lf: Boolean(f.requiere_lf),
    requiere_itse: Boolean(f.requiere_itse),
    esta_activo: Boolean(f.esta_activo),
  };
};

const onError = (fallback: string) => (err: any) => {
  fieldErrors.value = extractFieldErrors(err);
  const errores = Object.values(fieldErrors.value);
  // Si hay un solo error de campo, se muestra tal cual (el backend lo envía en español)
  formError.value = errores.length === 1 ? errores[0] : errores.length ? 'Revise los campos marcados en rojo.' : extractErrorMessage(err, fallback);
};

const handleSubmit = () => {
  resetErrors();
  const mensaje = validar();
  if (mensaje) {
    formError.value = mensaje;
    return;
  }
  const payload = construirPayload();

  if (isEditMode.value && editingId.value) {
    actualizar.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios del procedimiento se guardaron correctamente.');
        },
        onError: onError('Error al actualizar el procedimiento'),
      },
    );
  } else {
    crear.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success(`El procedimiento ${payload.codigo} se registró correctamente.`);
      },
      onError: onError('Error al registrar el procedimiento'),
    });
  }
};

/** Desactivar conserva el procedimiento (y sus expedientes) pero evita usarlo en trámites nuevos. */
const desactivar = (p: TiposProcedimientoTupa) =>
  actualizar.mutateAsync({ id: p.id, data: { esta_activo: false } });

/**
 * Si el backend rechaza el borrado por estar en uso (409), el diálogo muestra el motivo
 * dentro de sí. Además se ofrece desactivarlo, que es la acción correcta en ese caso.
 */
const handleDeleteConAlternativa = async (item: any) => {
  const p: TiposProcedimientoTupa = item.raw;
  let enUso = false;
  const ok = await dialog.confirmDelete({
    title: 'Eliminar procedimiento',
    text: `¿Eliminar "${p.codigo} · ${p.nombre}"?\nSolo es posible si ningún expediente lo usa.`,
    onConfirm: async () => {
      try {
        await eliminar.mutateAsync(p.id);
      } catch (err: any) {
        if (err?.response?.status === 409) {
          enUso = true;
          return; // cerramos este diálogo y ofrecemos desactivar
        }
        throw err; // otros errores se muestran dentro del diálogo
      }
    },
  });
  if (!ok) return;
  if (!enUso) {
    toast.success(`El procedimiento ${p.codigo} se eliminó correctamente.`);
    return;
  }
  if (!p.esta_activo) {
    toast.warning('El procedimiento tiene expedientes asociados y ya está inactivo.', 'No se puede eliminar');
    return;
  }
  const desactivarOk = await dialog.confirm({
    title: 'No se puede eliminar',
    text: `"${p.codigo}" tiene expedientes asociados.\n¿Desea desactivarlo para que no se use en trámites nuevos?`,
    variant: 'warning',
    confirmText: 'Sí, desactivar',
    onConfirm: () => desactivar(p),
  });
  if (desactivarOk) toast.success(`El procedimiento ${p.codigo} quedó inactivo.`);
};
const labelClass = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all';
const errorInputClass = 'border-red-400 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20';
const hintClass = 'text-[11px] text-neutral-400 dark:text-neutral-500 mt-1';
const checkRowClass =
  'flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors';
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar procedimientos: {{ error.message }}
    </div>

    <CrudTable
      title="Procedimientos del TUPA"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDeleteConAlternativa"
    />

    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Procedimiento TUPA' : 'Registrar Procedimiento TUPA'"
      :subtitle="isEditMode ? `Modificando ${form.codigo}` : 'Plazos y unidad responsable según el Texto Único de Procedimientos Administrativos'"
      maxWidth="max-w-2xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Registrar Procedimiento'"
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
        <!-- Bloque 1: Identificación -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label :class="labelClass" for="tupa-codigo">Código <span class="text-red-500">*</span></label>
            <input id="tupa-codigo" v-model="form.codigo" type="text" :maxlength="MAX_CODIGO" placeholder="Ej. PE-LF-01" :class="[inputClass, 'uppercase font-mono font-bold', fieldError('codigo') ? errorInputClass : '']" />
            <p v-if="fieldError('codigo')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('codigo') }}</p>
          </div>
          <div class="sm:col-span-2">
            <label :class="labelClass" for="tupa-unidad">Unidad Orgánica Responsable <span class="text-red-500">*</span></label>
            <select id="tupa-unidad" v-model="form.unidad_organica_id" :class="[inputClass, fieldError('unidad_organica_id') ? errorInputClass : '']">
              <option value="" disabled>Seleccione...</option>
              <option v-for="u in unidadesActivas" :key="u.id" :value="u.id">{{ u.sigla ? `${u.sigla} · ` : '' }}{{ u.nombre }}</option>
            </select>
            <p v-if="!unidadesActivas.length" class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">No hay unidades orgánicas activas registradas.</p>
          </div>
        </div>
        <div>
          <label :class="labelClass" for="tupa-nombre">Nombre del Procedimiento <span class="text-red-500">*</span></label>
          <textarea id="tupa-nombre" v-model="form.nombre" rows="2" :maxlength="MAX_NOMBRE" placeholder="Ej. LICENCIA DE FUNCIONAMIENTO PARA ESTABLECIMIENTOS CON NIVEL DE RIESGO BAJO" :class="[inputClass, 'uppercase resize-none', fieldError('nombre') ? errorInputClass : '']"></textarea>
          <p :class="hintClass">{{ form.nombre.length }} / {{ MAX_NOMBRE }} caracteres</p>
        </div>

        <!-- Bloque 2: Plazos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label :class="labelClass" for="tupa-plazo">Plazo de Atención <span class="text-red-500">*</span></label>
            <div class="relative">
              <input id="tupa-plazo" v-model="form.plazo_atencion_dias" type="number" min="1" step="1" placeholder="Ej. 7" :class="[inputClass, 'pr-24', fieldError('plazo_atencion_dias') ? errorInputClass : '']" />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">días hábiles</span>
            </div>
          </div>
          <div>
            <label :class="labelClass" for="tupa-alerta">Alerta de Vencimiento <span class="text-red-500">*</span></label>
            <div class="relative">
              <input id="tupa-alerta" v-model="form.dias_alerta_vencimiento" type="number" min="0" step="1" :max="form.plazo_atencion_dias || undefined" placeholder="Ej. 2" :class="[inputClass, 'pr-24', fieldError('dias_alerta_vencimiento') ? errorInputClass : '']" />
              <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 pointer-events-none">días antes</span>
            </div>
            <p :class="hintClass">Se avisa esta cantidad de días antes del vencimiento (0 = sin alerta).</p>
          </div>
        </div>

        <!-- Bloque 3: Qué emite y estado -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <span :class="labelClass">El trámite emite</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label :class="checkRowClass">
              <input v-model="form.requiere_lf" type="checkbox" class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500" />
              <div>
                <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Licencia de Funcionamiento</span>
                <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">El expediente queda pendiente hasta emitir la LF</span>
              </div>
            </label>
            <label :class="checkRowClass">
              <input v-model="form.requiere_itse" type="checkbox" class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500" />
              <div>
                <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Certificado ITSE</span>
                <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">El expediente queda pendiente hasta emitir el ITSE</span>
              </div>
            </label>
          </div>

          <label :class="checkRowClass">
            <input v-model="form.esta_activo" type="checkbox" class="w-4 h-4 text-emerald-600 rounded border-neutral-300 focus:ring-emerald-500" />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Procedimiento activo</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Si se desactiva, no se ofrece al registrar expedientes nuevos</span>
            </div>
          </label>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
