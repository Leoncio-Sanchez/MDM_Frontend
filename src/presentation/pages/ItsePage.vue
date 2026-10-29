<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  useItseList,
  useCrearItse,
  useActualizarItse,
  useInactivarItse,
  useInspeccionExpedienteItse,
} from '../../application/composables/useItse';
import { usePersonasList } from '../../application/composables/usePersonas';
import { useExpedientesList } from '../../application/composables/useExpedientes';
import { useNivelesRiesgoList } from '../../application/composables/useNivelesRiesgo';
import { useEstadosInactivosItse } from '../../application/composables/useEstados';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import ArchivosAdjuntos from '../components/organisms/ArchivosAdjuntos.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import SearchableSelect, { type SelectOption } from '../components/molecules/SearchableSelect.vue';
import { useToast, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { Itse, ItsePayload, TipoItse } from '../../domain/entities/Itse.entity';
import type { Personas } from '../../domain/entities/Personas.entity';
import type { Expedientes } from '../../domain/entities/Expedientes.entity';
import type { NivelesRiesgo } from '../../domain/entities/NivelesRiesgo.entity';

const { data, isLoading, error } = useItseList();
const { data: personasData } = usePersonasList();
const { data: expedientesData } = useExpedientesList();
const { data: nivelesRiesgoData } = useNivelesRiesgoList();
const { data: estadosInactivosData } = useEstadosInactivosItse();

const crearItse = useCrearItse();
const actualizarItse = useActualizarItse();
const inactivarItse = useInactivarItse();
const toast = useToast();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

/** Vigencia del certificado ITSE: 2 años desde su expedición (D.S. N° 002-2018-PCM). */
const ANIOS_VIGENCIA = 2;
const DIAS_ALERTA_VENCIMIENTO = 30;

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const sumarAnios = (fechaISO: string, anios: number) => {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const fecha = new Date(y + anios, m - 1, d);
  // Un 29 de febrero que cae en año no bisiesto pasa al 1 de marzo: se ajusta al 28.
  if (fecha.getMonth() !== m - 1) fecha.setDate(0);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
};

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'itse',
  initialData: {
    tipo_itse_id: 1 as TipoItse,
    numero_itse: '' as string | number,
    itse_principal_id: '' as string | number,
    expediente_id: '' as string | number,
    titular_id: '' as string | number,
    conductor_id: '' as string | number,
    nivel_riesgo_id: '' as string | number,
    fecha_expedicion: '',
    fecha_caducidad: '',
    fecha_solicitud_renovacion: '',
    nombre_comercial: '',
    direccion: '',
    resolucion_numero: '',
    area: '' as string | number,
    capacidad_aforo: '' as string | number,
    numero_recibo_pago: '',
    observaciones: '',
    se_puede_publicar: true,
  },
});

const isSubmitting = computed(() => crearItse.isPending.value || actualizarItse.isPending.value);
const esRenovacion = computed(() => Number(form.value.tipo_itse_id) === 2);

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const itseList = computed(() => listOf<Itse>(data.value));
const personas = computed(() => listOf<Personas>(personasData.value));
const expedientes = computed(() => listOf<Expedientes>(expedientesData.value));
const nivelesRiesgo = computed(() => listOf<NivelesRiesgo>(nivelesRiesgoData.value).filter((n) => n.esta_activo));
const estadosInactivos = computed(() => listOf<{ id: number; nombre: string }>(estadosInactivosData.value));

const personasById = computed(() => new Map(personas.value.map((p) => [p.id, p])));
const expedientesById = computed(() => new Map(expedientes.value.map((e) => [e.id, e])));

const nombrePersona = (p?: Personas) =>
  !p ? '' : p.tipo_persona === 'J' ? p.nombres : [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');

const personasSelectOptions = computed<SelectOption[]>(() =>
  personas.value.map((p) => ({
    value: p.id,
    label: nombrePersona(p) || `Persona #${p.id}`,
    code: p.tipo_persona === 'J' ? 'JUR' : 'NAT',
    badge: p.documentos?.[0]?.numero_documento,
  })),
);

// Un expediente anulado no admite emitir ITSE (el servidor también lo rechaza)
const expedientesSelectOptions = computed<SelectOption[]>(() =>
  expedientes.value.filter((e) => !e.anulado).map((e) => ({
    value: e.id,
    label: `Expediente N° ${e.numero_expediente ?? e.id}`,
    code: `#${e.numero_expediente ?? e.id}`,
    badge: e.fecha_recepcion ? e.fecha_recepcion.split('T')[0] : undefined,
    subtitle: nombrePersona(personasById.value.get(Number(e.solicitante_id ?? e.solicitante))),
  })),
);

const itsePrincipalOptions = computed<SelectOption[]>(() =>
  itseList.value
    .filter((i) => i.id !== editingId.value)
    .map((i) => ({ value: i.id, label: i.nombre_comercial, code: `N° ${i.numero_itse}`, badge: `Caduca: ${i.fecha_caducidad}` })),
);

/** Situación del certificado según su historial y fecha de caducidad */
const situacion = (i: Itse) => {
  if (i.historial_estados?.length) return 'INACTIVO';
  const hoy = hoyISO();
  if (i.fecha_caducidad < hoy) return 'VENCIDO';
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_ALERTA_VENCIMIENTO);
  if (new Date(i.fecha_caducidad) <= limite) return 'POR VENCER';
  return 'VIGENTE';
};

const columns = [
  { key: 'numero_itse', label: 'N° ITSE' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'expediente', label: 'EXPEDIENTE' },
  { key: 'fecha_expedicion', label: 'EXPEDICIÓN' },
  { key: 'fecha_caducidad', label: 'CADUCIDAD' },
  { key: 'situacion', label: 'SITUACIÓN' },
];

const displayData = computed(() =>
  itseList.value.map((i) => ({
    id: i.id,
    numero_itse: i.numero_itse,
    tipo: Number(i.tipo_itse_id) === 2 ? 'Renovación' : 'Estándar',
    nombre_comercial: i.nombre_comercial,
    titular: nombrePersona(personasById.value.get(i.titular)) || `#${i.titular}`,
    expediente: `N° ${expedientesById.value.get(i.expediente)?.numero_expediente ?? i.expediente}`,
    fecha_expedicion: i.fecha_expedicion,
    fecha_caducidad: i.fecha_caducidad,
    situacion: situacion(i),
    raw: i,
  })),
);

// Sugerir la fecha de caducidad (expedición + 2 años) mientras el usuario no la haya fijado a mano
const caducidadSugerida = ref('');
watch(
  () => form.value.fecha_expedicion,
  (exp) => {
    if (!exp || !isModalOpen.value) return;
    if (!form.value.fecha_caducidad || form.value.fecha_caducidad === caducidadSugerida.value) {
      caducidadSugerida.value = sumarAnios(exp, ANIOS_VIGENCIA);
      form.value.fecha_caducidad = caducidadSugerida.value;
    }
  },
);

// Al elegir el expediente, proponer como titular a su solicitante
watch(
  () => form.value.expediente_id,
  (id) => {
    if (!id || isEditMode.value || form.value.titular_id) return;
    const exp = expedientesById.value.get(Number(id));
    const solicitante = exp?.solicitante_id ?? exp?.solicitante;
    if (solicitante) form.value.titular_id = solicitante;
  },
);

// El certificado se sustenta en el acta Aprobada del inspector (el servidor también lo exige)
const expedienteAConsultar = computed(() =>
  isModalOpen.value && !isEditMode.value && form.value.expediente_id ? Number(form.value.expediente_id) : null,
);
const { data: inspeccion, isFetching: consultandoInspeccion } = useInspeccionExpedienteItse(expedienteAConsultar);
const sinActaAprobada = computed(() => (expedienteAConsultar.value !== null && inspeccion.value?.se_puede_emitir === false ? inspeccion.value.mensaje : null));

// Área y aforo comprobados en la visita: se proponen si aún no se escribieron
watch(inspeccion, (situacion) => {
  const acta = situacion?.acta;
  if (!acta || acta.resultado !== 'APROBADO' || isEditMode.value) return;
  if (form.value.area === '' || form.value.area === null) form.value.area = acta.area_m2;
  if (form.value.capacidad_aforo === '' || form.value.capacidad_aforo === null) form.value.capacidad_aforo = acta.aforo;
});

const fieldError = (campo: string) => fieldErrors.value[campo];

const resetErrors = () => {
  formError.value = null;
  fieldErrors.value = {};
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  caducidadSugerida.value = '';
  resetErrors();
  loadDraft();
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  const i: Itse = item.raw;
  isEditMode.value = true;
  editingId.value = i.id;
  resetErrors();
  setFormData({
    tipo_itse_id: Number(i.tipo_itse_id) as TipoItse,
    numero_itse: i.numero_itse,
    itse_principal_id: i.itse_principal ?? '',
    expediente_id: i.expediente,
    titular_id: i.titular,
    conductor_id: i.conductor && i.conductor !== i.titular ? i.conductor : '',
    nivel_riesgo_id: i.nivel_riesgo,
    fecha_expedicion: i.fecha_expedicion,
    fecha_caducidad: i.fecha_caducidad,
    fecha_solicitud_renovacion: i.fecha_solicitud_renovacion ?? '',
    nombre_comercial: i.nombre_comercial ?? '',
    direccion: i.direccion ?? '',
    resolucion_numero: i.resolucion_numero ?? '',
    area: i.area ?? '',
    capacidad_aforo: i.capacidad_aforo ?? '',
    numero_recibo_pago: i.numero_recibo_pago ?? '',
    observaciones: i.observaciones ?? '',
    se_puede_publicar: i.se_puede_publicar ?? true,
  });
  caducidadSugerida.value = '';
  isModalOpen.value = true;
};

/** Validación en el cliente. Devuelve el primer mensaje de error o null. */
const validar = (): string | null => {
  const f = form.value;
  if (!f.numero_itse || Number(f.numero_itse) <= 0) return 'Ingrese el número de ITSE.';
  if (esRenovacion.value && !isEditMode.value && !f.itse_principal_id) return 'Seleccione el ITSE que se está renovando.';
  if (!isEditMode.value && !f.expediente_id) return 'Seleccione el expediente de origen.';
  if (sinActaAprobada.value) return sinActaAprobada.value;
  if (!f.titular_id) return 'Seleccione el titular.';
  if (!f.nivel_riesgo_id) return 'Seleccione el nivel de riesgo.';
  if (!f.nombre_comercial.trim()) return 'Ingrese el nombre comercial del establecimiento.';
  if (!f.direccion.trim()) return 'Ingrese la dirección del establecimiento.';
  if (!f.fecha_expedicion) return 'Ingrese la fecha de expedición.';
  if (!f.fecha_caducidad) return 'Ingrese la fecha de caducidad.';
  if (f.fecha_caducidad < f.fecha_expedicion) return 'La fecha de caducidad no puede ser anterior a la expedición.';
  if (!f.resolucion_numero.trim()) return 'Ingrese el número de resolución.';
  if (!f.area || Number(f.area) <= 0) return 'Ingrese el área del establecimiento (m²).';
  if (!f.numero_recibo_pago.trim()) return 'Ingrese el número de recibo de pago.';
  return null;
};

const construirPayload = (): ItsePayload => {
  const f = form.value;
  const payload: ItsePayload = {
    tipo_itse_id: Number(f.tipo_itse_id) as TipoItse,
    numero_itse: Number(f.numero_itse),
    fecha_expedicion: f.fecha_expedicion,
    fecha_caducidad: f.fecha_caducidad,
    fecha_solicitud_renovacion: esRenovacion.value && f.fecha_solicitud_renovacion ? f.fecha_solicitud_renovacion : null,
    nombre_comercial: f.nombre_comercial.trim().toUpperCase(),
    direccion: f.direccion.trim().toUpperCase(),
    resolucion_numero: f.resolucion_numero.trim().toUpperCase(),
    area: Number(f.area),
    numero_recibo_pago: f.numero_recibo_pago.trim().toUpperCase(),
    observaciones: f.observaciones.trim() || null,
    se_puede_publicar: Boolean(f.se_puede_publicar),
    nivel_riesgo_id: Number(f.nivel_riesgo_id),
    titular_id: Number(f.titular_id),
    // Si no se indica conductor, el titular es quien conduce el establecimiento
    conductor_id: Number(f.conductor_id || f.titular_id),
  };
  if (f.capacidad_aforo !== '' && f.capacidad_aforo !== null) payload.capacidad_aforo = Number(f.capacidad_aforo);
  if (!isEditMode.value) {
    payload.expediente_id = Number(f.expediente_id);
    payload.itse_principal_id = esRenovacion.value && f.itse_principal_id ? Number(f.itse_principal_id) : null;
  }
  return payload;
};

const onError = (fallback: string) => (err: any) => {
  fieldErrors.value = extractFieldErrors(err);
  formError.value = Object.keys(fieldErrors.value).length
    ? 'Revise los campos marcados en rojo.'
    : extractErrorMessage(err, fallback);
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
    actualizarItse.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios del ITSE se guardaron correctamente.');
        },
        onError: onError('Error al actualizar el ITSE'),
      },
    );
  } else {
    crearItse.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success(`El ITSE N° ${payload.numero_itse} se registró correctamente.`);
      },
      onError: onError('Error al registrar el ITSE'),
    });
  }
};

// ── Inactivación (los ITSE no se eliminan) ────────────────────────────
const isInactivarOpen = ref(false);
const itseAInactivar = ref<Itse | null>(null);
const inactivarError = ref<string | null>(null);
const inactivarForm = ref({ estado_id: '' as string | number, fecha_estado: '', documento: '', observaciones: '' });

const handleInactivar = (item: any) => {
  const i: Itse = item.raw;
  if (i.historial_estados?.length) {
    toast.warning(`El ITSE N° ${i.numero_itse} ya se encuentra inactivo.`);
    return;
  }
  itseAInactivar.value = i;
  inactivarError.value = null;
  inactivarForm.value = { estado_id: estadosInactivos.value[0]?.id ?? '', fecha_estado: hoyISO(), documento: '', observaciones: '' };
  isInactivarOpen.value = true;
};

const handleSubmitInactivar = () => {
  inactivarError.value = null;
  const f = inactivarForm.value;
  if (!f.estado_id) return (inactivarError.value = 'Seleccione el motivo de inactivación.');
  if (!f.fecha_estado) return (inactivarError.value = 'Ingrese la fecha.');
  if (!f.documento.trim()) return (inactivarError.value = 'Ingrese el documento que sustenta la inactivación.');
  if (!f.observaciones.trim()) return (inactivarError.value = 'Ingrese las observaciones.');
  if (!itseAInactivar.value) return;

  inactivarItse.mutate(
    {
      itse_id: itseAInactivar.value.id,
      estado_id: Number(f.estado_id),
      fecha_estado: f.fecha_estado,
      documento: f.documento.trim().toUpperCase(),
      observaciones: f.observaciones.trim(),
    },
    {
      onSuccess: () => {
        toast.success(`El ITSE N° ${itseAInactivar.value?.numero_itse} fue inactivado.`);
        isInactivarOpen.value = false;
        itseAInactivar.value = null;
      },
      onError: (err: any) => {
        inactivarError.value = extractErrorMessage(err, 'No se pudo inactivar el ITSE.');
      },
    },
  );
};

const labelClass = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all';
const errorInputClass = 'border-red-400 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20';
const hintClass = 'text-[11px] text-neutral-400 dark:text-neutral-500 mt-1';

// ── Archivos adjuntos (actas, fotos, documentos) ─────────────────────
const archivosDe = ref<{ id: number; titulo: string } | null>(null);
const abrirArchivos = (row: { id: number; numero_itse?: string | number }) => {
  archivosDe.value = { id: row.id, titulo: `Certificado ITSE N° ${row.numero_itse ?? row.id}` };
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 font-semibold mb-4 bg-red-50 border border-red-200 rounded-xl">
      Error al cargar ITSE: {{ error.message }}
    </div>

    <CrudTable
      title="Control de Inspecciones Técnicas de Seguridad (ITSE)"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      delete-label="Inactivar"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleInactivar">
      <template #acciones-fila="{ row }">
        <button
          type="button"
          class="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white mr-4 font-semibold hover:underline cursor-pointer"
          @click="abrirArchivos(row)"
        >
          Archivos
        </button>
      </template>
    </CrudTable>

    <ArchivosAdjuntos
      :open="archivosDe !== null"
      modulo="itse"
      :registro-id="archivosDe?.id ?? null"
      :titulo="archivosDe?.titulo ?? ''"
      @close="archivosDe = null"
    />

    <!-- Registro / edición de certificado ITSE -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Certificado ITSE' : 'Registrar Certificado ITSE'"
      :subtitle="isEditMode ? `Modificando ITSE N° ${form.numero_itse}` : 'Datos del certificado emitido tras la inspección técnica de seguridad'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Registrar ITSE'"
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
        <!-- Bloque 1: Identificación del certificado -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span :class="labelClass">Tipo de ITSE <span class="text-red-500">*</span></span>
            <div class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700">
              <button
                v-for="opt in [{ value: 1, label: 'Estándar' }, { value: 2, label: 'Renovación' }]"
                :key="opt.value"
                type="button"
                :disabled="isEditMode"
                @click="form.tipo_itse_id = opt.value as TipoItse"
                :class="[
                  'py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed',
                  Number(form.tipo_itse_id) === opt.value
                    ? 'bg-white dark:bg-[#18181b] text-[#0d6efd] dark:text-blue-400 shadow-xs border border-neutral-200 dark:border-neutral-700'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200',
                ]"
                :aria-pressed="Number(form.tipo_itse_id) === opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
          <div>
            <label :class="labelClass" for="itse-numero">N° de ITSE <span class="text-red-500">*</span></label>
            <input id="itse-numero" v-model="form.numero_itse" type="number" min="1" placeholder="Ej. 2026045" :class="[inputClass, 'font-mono font-bold', fieldError('numero_itse') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="itse-resolucion">N° de Resolución <span class="text-red-500">*</span></label>
            <input id="itse-resolucion" v-model="form.resolucion_numero" type="text" maxlength="50" placeholder="Ej. 045-2026-SGDC" :class="[inputClass, 'uppercase font-mono', fieldError('resolucion_numero') ? errorInputClass : '']" />
          </div>
        </div>

        <!-- ITSE que se renueva -->
        <div v-if="esRenovacion" class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
          <div class="sm:col-span-2">
            <span :class="labelClass">ITSE que se renueva <span v-if="!isEditMode" class="text-red-500">*</span></span>
            <SearchableSelect
              v-model="form.itse_principal_id"
              :options="itsePrincipalOptions"
              :disabled="isEditMode"
              placeholder="Buscar ITSE anterior..."
              search-placeholder="Escriba número o nombre comercial..."
            />
          </div>
          <div>
            <label :class="labelClass" for="itse-fecha-renov">Solicitud de Renovación</label>
            <input id="itse-fecha-renov" v-model="form.fecha_solicitud_renovacion" type="date" :class="inputClass" />
          </div>
        </div>

        <!-- Bloque 2: Expediente y personas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div class="sm:col-span-2">
            <span :class="labelClass">Expediente de Origen <span v-if="!isEditMode" class="text-red-500">*</span></span>
            <SearchableSelect
              v-model="form.expediente_id"
              :options="expedientesSelectOptions"
              :disabled="isEditMode"
              placeholder="Buscar expediente..."
              search-placeholder="Escriba número de expediente o solicitante..."
            />
            <p v-if="isEditMode" :class="hintClass">El expediente de origen no se puede cambiar después del registro.</p>
            <p v-else-if="!expedientesSelectOptions.length" class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">No hay expedientes registrados. Créelos en Operaciones → Expedientes TUPA.</p>
            <template v-else-if="expedienteAConsultar !== null">
              <p v-if="consultandoInspeccion && !inspeccion" :class="hintClass">Consultando el acta de inspección…</p>
              <p
                v-else-if="sinActaAprobada"
                role="alert"
                class="mt-2 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-[11px] font-medium text-amber-900 dark:text-amber-200"
              >
                {{ sinActaAprobada }}
              </p>
              <p
                v-else-if="inspeccion?.acta?.resultado === 'APROBADO'"
                class="mt-2 p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-medium text-emerald-800 dark:text-emerald-200"
              >
                Sustento: acta de inspección N° {{ inspeccion.acta.numero_acta }} Aprobada (visita del {{ new Date(inspeccion.acta.fecha_visita).toLocaleDateString('es-PE') }}):
                {{ inspeccion.acta.area_m2.toLocaleString('es-PE') }} m² y aforo de {{ inspeccion.acta.aforo }} personas.
              </p>
            </template>
          </div>
          <div>
            <span :class="labelClass">Titular <span class="text-red-500">*</span></span>
            <SearchableSelect
              v-model="form.titular_id"
              :options="personasSelectOptions"
              placeholder="Buscar titular..."
              search-placeholder="Escriba nombre, razón social o documento..."
            />
          </div>
          <div>
            <span :class="labelClass">Conductor</span>
            <SearchableSelect
              v-model="form.conductor_id"
              :options="personasSelectOptions"
              placeholder="El mismo titular"
              search-placeholder="Escriba nombre, razón social o documento..."
            />
            <p :class="hintClass">Déjelo vacío si el titular conduce el establecimiento.</p>
          </div>
        </div>

        <!-- Bloque 3: Establecimiento -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div>
            <label :class="labelClass" for="itse-nombre">Nombre Comercial <span class="text-red-500">*</span></label>
            <input id="itse-nombre" v-model="form.nombre_comercial" type="text" maxlength="250" placeholder="Ej. BODEGA Y MINIMARKET SANTA ROSA" :class="[inputClass, 'uppercase font-medium', fieldError('nombre_comercial') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="itse-direccion">Dirección del Establecimiento <span class="text-red-500">*</span></label>
            <input id="itse-direccion" v-model="form.direccion" type="text" maxlength="250" placeholder="Ej. AV. NICOLÁS DE PIÉROLA 450" :class="[inputClass, 'uppercase', fieldError('direccion') ? errorInputClass : '']" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label :class="labelClass" for="itse-riesgo">Nivel de Riesgo <span class="text-red-500">*</span></label>
              <select id="itse-riesgo" v-model="form.nivel_riesgo_id" :class="[inputClass, fieldError('nivel_riesgo_id') ? errorInputClass : '']">
                <option value="" disabled>Seleccione...</option>
                <option v-for="nr in nivelesRiesgo" :key="nr.id" :value="nr.id">{{ nr.nombre }} ({{ nr.codigo }})</option>
              </select>
            </div>
            <div>
              <label :class="labelClass" for="itse-area">Área (m²) <span class="text-red-500">*</span></label>
              <input id="itse-area" v-model="form.area" type="number" min="0" step="0.01" placeholder="Ej. 85.50" :class="[inputClass, fieldError('area') ? errorInputClass : '']" />
            </div>
            <div>
              <label :class="labelClass" for="itse-aforo">Capacidad / Aforo</label>
              <input id="itse-aforo" v-model="form.capacidad_aforo" type="number" min="0" step="1" placeholder="Ej. 40" :class="[inputClass, fieldError('capacidad_aforo') ? errorInputClass : '']" />
            </div>
          </div>
        </div>

        <!-- Bloque 4: Fechas y pago -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label :class="labelClass" for="itse-expedicion">Fecha de Expedición <span class="text-red-500">*</span></label>
            <input id="itse-expedicion" v-model="form.fecha_expedicion" type="date" :class="[inputClass, fieldError('fecha_expedicion') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="itse-caducidad">Fecha de Caducidad <span class="text-red-500">*</span></label>
            <input id="itse-caducidad" v-model="form.fecha_caducidad" type="date" :min="form.fecha_expedicion || undefined" :class="[inputClass, fieldError('fecha_caducidad') ? errorInputClass : '']" />
            <p v-if="form.fecha_caducidad && form.fecha_caducidad === caducidadSugerida" :class="hintClass">Sugerida: {{ ANIOS_VIGENCIA }} años de vigencia. Puede modificarla.</p>
          </div>
          <div>
            <label :class="labelClass" for="itse-recibo">N° Recibo de Pago <span class="text-red-500">*</span></label>
            <input id="itse-recibo" v-model="form.numero_recibo_pago" type="text" maxlength="20" placeholder="Ej. 0012-45871" :class="[inputClass, 'uppercase font-mono', fieldError('numero_recibo_pago') ? errorInputClass : '']" />
          </div>
        </div>

        <!-- Bloque 5: Publicación y observaciones -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input v-model="form.se_puede_publicar" type="checkbox" class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500" />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Publicable en la consulta ciudadana</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">El certificado podrá ser verificado por el público en el portal municipal</span>
            </div>
          </label>
          <div>
            <label :class="labelClass" for="itse-obs">Observaciones</label>
            <textarea id="itse-obs" v-model="form.observaciones" rows="2" maxlength="1000" placeholder="Condiciones de seguridad observadas, restricciones de aforo, referencias..." :class="[inputClass, 'resize-none']"></textarea>
          </div>
        </div>
      </div>
    </LargeModal>

    <!-- Inactivación de ITSE -->
    <LargeModal
      v-model="isInactivarOpen"
      title="Inactivar Certificado ITSE"
      :subtitle="itseAInactivar ? `ITSE N° ${itseAInactivar.numero_itse} · ${itseAInactivar.nombre_comercial}` : ''"
      maxWidth="max-w-lg"
      :is-loading="inactivarItse.isPending.value"
      :is-edit-mode="true"
      submit-text="Inactivar ITSE"
      @submit="handleSubmitInactivar"
    >
      <div v-if="inactivarError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl" role="alert">
        {{ inactivarError }}
      </div>
      <p class="text-xs text-amber-800 dark:text-amber-300 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
        El certificado dejará de estar vigente. El registro se conserva en el historial y esta acción no se puede deshacer desde el sistema.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label :class="labelClass" for="inact-estado">Motivo <span class="text-red-500">*</span></label>
          <select id="inact-estado" v-model="inactivarForm.estado_id" :class="inputClass">
            <option value="" disabled>Seleccione...</option>
            <option v-for="e in estadosInactivos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
          <p v-if="!estadosInactivos.length" class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            No hay estados inactivos para ITSE. Regístrelos en Administración → Estados.
          </p>
        </div>
        <div>
          <label :class="labelClass" for="inact-fecha">Fecha <span class="text-red-500">*</span></label>
          <input id="inact-fecha" v-model="inactivarForm.fecha_estado" type="date" :class="inputClass" />
        </div>
      </div>
      <div>
        <label :class="labelClass" for="inact-doc">Documento de Sustento <span class="text-red-500">*</span></label>
        <input id="inact-doc" v-model="inactivarForm.documento" type="text" maxlength="100" placeholder="Ej. RESOLUCIÓN N° 120-2026-SGDC" :class="[inputClass, 'uppercase']" />
      </div>
      <div>
        <label :class="labelClass" for="inact-obs">Observaciones <span class="text-red-500">*</span></label>
        <textarea id="inact-obs" v-model="inactivarForm.observaciones" rows="3" maxlength="1000" placeholder="Motivo detallado de la inactivación..." :class="[inputClass, 'resize-none']"></textarea>
      </div>
    </LargeModal>
  </div>
</template>
