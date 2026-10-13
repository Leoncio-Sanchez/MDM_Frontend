<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  useLicenciasFuncionamientoList,
  useCrearLicenciasFuncionamiento,
  useActualizarLicenciasFuncionamiento,
  useInactivarLicenciasFuncionamiento,
} from '../../application/composables/useLicenciasFuncionamiento';
import { useTiposLicenciaList } from '../../application/composables/useTiposLicencia';
import { useExpedientesList } from '../../application/composables/useExpedientes';
import { usePersonasList } from '../../application/composables/usePersonas';
import { useNivelesRiesgoList } from '../../application/composables/useNivelesRiesgo';
import { useZonificacionesList } from '../../application/composables/useZonificaciones';
import { useEstadosInactivosLf } from '../../application/composables/useEstados';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import SearchableSelect, { type SelectOption } from '../components/molecules/SearchableSelect.vue';
import { useToast, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { LicenciasFuncionamiento, LicenciaPayload } from '../../domain/entities/LicenciasFuncionamiento.entity';
import type { Personas } from '../../domain/entities/Personas.entity';
import type { Expedientes } from '../../domain/entities/Expedientes.entity';
import type { TiposLicencia } from '../../domain/entities/TiposLicencia.entity';
import type { NivelesRiesgo } from '../../domain/entities/NivelesRiesgo.entity';
import type { Zonificaciones } from '../../domain/entities/Zonificaciones.entity';

const { data, isLoading, error } = useLicenciasFuncionamientoList();
const { data: tiposLicenciaData } = useTiposLicenciaList();
const { data: expedientesData } = useExpedientesList();
const { data: personasData } = usePersonasList();
const { data: nivelesRiesgoData } = useNivelesRiesgoList();
const { data: zonificacionesData } = useZonificacionesList();
const { data: estadosInactivosData } = useEstadosInactivosLf();

const crearLicencia = useCrearLicenciasFuncionamiento();
const actualizarLicencia = useActualizarLicenciasFuncionamiento();
const inactivarLicencia = useInactivarLicenciasFuncionamiento();
const toast = useToast();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

/** Límites de las columnas en BD (ver ReglasDatosLicencia en el backend) */
const MAX_ACTIVIDAD = 50;
const HORAS = Array.from({ length: 25 }, (_, h) => h);

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatoHora = (h: number) => `${String(h).padStart(2, '0')}:00`;

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'licencia_funcionamiento',
  initialData: {
    numero_licencia: '' as string | number,
    nombre_comercial: '',
    tipo_licencia_id: '' as string | number,
    expediente_id: '' as string | number,
    titular_id: '' as string | number,
    conductor_id: '' as string | number,
    nivel_riesgo_id: '' as string | number,
    zonificacion_id: '' as string | number,
    actividad: '',
    direccion: '',
    hora_desde: 8 as number,
    hora_hasta: 20 as number,
    area: '' as string | number,
    resolucion_numero: '',
    numero_recibo_pago: '',
    es_vigencia_indeterminada: true,
    fecha_inicio_vigencia: '',
    fecha_fin_vigencia: '',
    observaciones: '',
    se_puede_publicar: true,
  },
});

const isSubmitting = computed(() => crearLicencia.isPending.value || actualizarLicencia.isPending.value);

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const licencias = computed(() => listOf<LicenciasFuncionamiento>(data.value));
const personas = computed(() => listOf<Personas>(personasData.value));
const expedientes = computed(() => listOf<Expedientes>(expedientesData.value));
const tiposLicencia = computed(() => listOf<TiposLicencia>(tiposLicenciaData.value));
const nivelesRiesgo = computed(() => listOf<NivelesRiesgo>(nivelesRiesgoData.value).filter((n) => n.esta_activo));
const zonificaciones = computed(() => listOf<Zonificaciones>(zonificacionesData.value).filter((z) => z.esta_activo));
const estadosInactivos = computed(() => listOf<{ id: number; nombre: string }>(estadosInactivosData.value));

const personasById = computed(() => new Map(personas.value.map((p) => [p.id, p])));
const expedientesById = computed(() => new Map(expedientes.value.map((e) => [e.id, e])));
const tiposLicenciaById = computed(() => new Map(tiposLicencia.value.map((t) => [t.id, t])));

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

const expedientesSelectOptions = computed<SelectOption[]>(() =>
  expedientes.value.map((e) => ({
    value: e.id,
    label: `Expediente N° ${e.numero_expediente ?? e.id}`,
    code: `#${e.numero_expediente ?? e.id}`,
    badge: e.fecha_recepcion ? String(e.fecha_recepcion).split('T')[0] : undefined,
    subtitle: nombrePersona(personasById.value.get(Number(e.solicitante_id ?? e.solicitante))),
  })),
);

/** Situación de la licencia según su historial y vigencia */
const situacion = (l: LicenciasFuncionamiento) => {
  if (l.historial_estados?.length) return 'INACTIVA';
  if (!l.es_vigencia_indeterminada && l.fecha_fin_vigencia && l.fecha_fin_vigencia < hoyISO()) return 'VENCIDA';
  return 'VIGENTE';
};

const columns = [
  { key: 'numero_licencia', label: 'N° LICENCIA' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'expediente', label: 'EXPEDIENTE' },
  { key: 'horario', label: 'HORARIO' },
  { key: 'fecha_emision', label: 'EMISIÓN' },
  { key: 'situacion', label: 'SITUACIÓN' },
];

const displayData = computed(() =>
  licencias.value.map((l) => ({
    id: l.id,
    numero_licencia: l.numero_licencia,
    nombre_comercial: l.nombre_comercial,
    titular: nombrePersona(personasById.value.get(l.titular)) || `#${l.titular}`,
    tipo: tiposLicenciaById.value.get(l.tipo_licencia)?.nombre ?? `#${l.tipo_licencia}`,
    expediente: `N° ${expedientesById.value.get(l.expediente)?.numero_expediente ?? l.expediente}`,
    horario: `${formatoHora(l.hora_desde)} – ${formatoHora(l.hora_hasta)}`,
    fecha_emision: l.fecha_emision,
    situacion: situacion(l),
    raw: l,
  })),
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
  const l: LicenciasFuncionamiento = item.raw;
  isEditMode.value = true;
  editingId.value = l.id;
  resetErrors();
  setFormData({
    numero_licencia: l.numero_licencia,
    nombre_comercial: l.nombre_comercial ?? '',
    tipo_licencia_id: l.tipo_licencia,
    expediente_id: l.expediente,
    titular_id: l.titular,
    conductor_id: l.conductor && l.conductor !== l.titular ? l.conductor : '',
    nivel_riesgo_id: l.nivel_riesgo,
    zonificacion_id: l.zonificacion,
    actividad: l.actividad ?? '',
    direccion: l.direccion ?? '',
    hora_desde: l.hora_desde ?? 8,
    hora_hasta: l.hora_hasta ?? 20,
    area: l.area ?? '',
    resolucion_numero: l.resolucion_numero ?? '',
    numero_recibo_pago: l.numero_recibo_pago ?? '',
    es_vigencia_indeterminada: l.es_vigencia_indeterminada ?? true,
    fecha_inicio_vigencia: l.fecha_inicio_vigencia ?? '',
    fecha_fin_vigencia: l.fecha_fin_vigencia ?? '',
    observaciones: l.observaciones ?? '',
    se_puede_publicar: l.se_puede_publicar ?? true,
  });
  isModalOpen.value = true;
};

/** Validación en el cliente (espejo de ReglasDatosLicencia). Devuelve el primer error o null. */
const validar = (): string | null => {
  const f = form.value;
  if (!isEditMode.value && (!f.numero_licencia || Number(f.numero_licencia) <= 0)) return 'Ingrese el número de licencia.';
  if (!f.tipo_licencia_id) return 'Seleccione el tipo de licencia.';
  if (!f.expediente_id) return 'Seleccione el expediente de origen.';
  if (!f.titular_id) return 'Seleccione el titular.';
  if (!f.nombre_comercial.trim()) return 'Ingrese el nombre comercial.';
  if (!f.actividad.trim()) return 'Ingrese la actividad o giro declarado.';
  if (f.actividad.trim().length > MAX_ACTIVIDAD) return `La actividad no puede superar ${MAX_ACTIVIDAD} caracteres.`;
  if (!f.direccion.trim()) return 'Ingrese la dirección del establecimiento.';
  if (!f.nivel_riesgo_id) return 'Seleccione el nivel de riesgo.';
  if (!f.zonificacion_id) return 'Seleccione la zonificación.';
  if (!f.area || Number(f.area) <= 0) return 'Ingrese el área del establecimiento (m²).';
  if (!f.resolucion_numero.trim()) return 'Ingrese el número de resolución.';
  if (!f.numero_recibo_pago.trim()) return 'Ingrese el número de recibo de pago.';
  if (!f.es_vigencia_indeterminada) {
    if (!f.fecha_inicio_vigencia || !f.fecha_fin_vigencia) return 'Indique el inicio y el fin de la vigencia.';
    if (f.fecha_fin_vigencia < f.fecha_inicio_vigencia) return 'El fin de la vigencia no puede ser anterior al inicio.';
  }
  return null;
};

const construirPayload = (): LicenciaPayload => {
  const f = form.value;
  const indeterminada = Boolean(f.es_vigencia_indeterminada);
  const payload: LicenciaPayload = {
    nombre_comercial: f.nombre_comercial.trim().toUpperCase(),
    tipo_licencia_id: Number(f.tipo_licencia_id),
    expediente_id: Number(f.expediente_id),
    titular_id: Number(f.titular_id),
    // Vacío = el titular conduce el establecimiento (el backend lo resuelve)
    conductor_id: f.conductor_id ? Number(f.conductor_id) : null,
    nivel_riesgo_id: Number(f.nivel_riesgo_id),
    zonificacion_id: Number(f.zonificacion_id),
    actividad: f.actividad.trim().toUpperCase(),
    direccion: f.direccion.trim().toUpperCase(),
    hora_desde: Number(f.hora_desde),
    hora_hasta: Number(f.hora_hasta),
    area: Number(f.area),
    resolucion_numero: f.resolucion_numero.trim().toUpperCase(),
    numero_recibo_pago: f.numero_recibo_pago.trim().toUpperCase(),
    es_vigencia_indeterminada: indeterminada,
    fecha_inicio_vigencia: indeterminada ? null : f.fecha_inicio_vigencia,
    fecha_fin_vigencia: indeterminada ? null : f.fecha_fin_vigencia,
    observaciones: f.observaciones.trim() || null,
    se_puede_publicar: Boolean(f.se_puede_publicar),
  };
  if (!isEditMode.value) payload.numero_licencia = Number(f.numero_licencia);
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
    actualizarLicencia.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios de la licencia se guardaron correctamente.');
        },
        onError: onError('Error al actualizar la licencia'),
      },
    );
  } else {
    crearLicencia.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success(`La licencia N° ${payload.numero_licencia} se emitió correctamente.`);
      },
      onError: onError('Error al emitir la licencia'),
    });
  }
};

// ── Inactivación (las licencias no se eliminan) ─────────────────────
const isInactivarOpen = ref(false);
const licenciaAInactivar = ref<LicenciasFuncionamiento | null>(null);
const inactivarError = ref<string | null>(null);
const inactivarForm = ref({ estado_id: '' as string | number, fecha_estado: '', documento: '', observaciones: '' });

const handleInactivar = (item: any) => {
  const l: LicenciasFuncionamiento = item.raw;
  if (l.historial_estados?.length) {
    toast.warning(`La licencia N° ${l.numero_licencia} ya se encuentra inactiva.`);
    return;
  }
  licenciaAInactivar.value = l;
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
  if (!licenciaAInactivar.value) return;

  inactivarLicencia.mutate(
    {
      licencia_id: licenciaAInactivar.value.id,
      estado_id: Number(f.estado_id),
      fecha_estado: f.fecha_estado,
      documento: f.documento.trim().toUpperCase(),
      observaciones: f.observaciones.trim(),
    },
    {
      onSuccess: () => {
        toast.success(`La licencia N° ${licenciaAInactivar.value?.numero_licencia} fue inactivada.`);
        isInactivarOpen.value = false;
        licenciaAInactivar.value = null;
      },
      onError: (err: any) => {
        inactivarError.value = extractErrorMessage(err, 'No se pudo inactivar la licencia.');
      },
    },
  );
};

const labelClass = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all';
const errorInputClass = 'border-red-400 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20';
const hintClass = 'text-[11px] text-neutral-400 dark:text-neutral-500 mt-1';
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar licencias: {{ error.message }}
    </div>

    <CrudTable
      title="Registro y Control de Licencias de Funcionamiento"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      delete-label="Inactivar"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleInactivar"
    />

    <!-- Emisión / edición de licencia -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Licencia de Funcionamiento' : 'Emitir Licencia de Funcionamiento'"
      :subtitle="isEditMode ? `Modificando Licencia N° ${form.numero_licencia}` : 'Datos técnicos y normativos para la emisión del certificado municipal'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Emitir Licencia'"
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
            <label :class="labelClass" for="lic-numero">N° de Licencia <span v-if="!isEditMode" class="text-red-500">*</span></label>
            <input id="lic-numero" v-model="form.numero_licencia" type="number" min="1" placeholder="Ej. 1001" :disabled="isEditMode" :class="[inputClass, 'font-mono font-bold', fieldError('numero_licencia') ? errorInputClass : '']" />
            <p v-if="isEditMode" :class="hintClass">El número de licencia no se modifica.</p>
          </div>
          <div class="sm:col-span-2">
            <label :class="labelClass" for="lic-tipo">Tipo de Licencia <span class="text-red-500">*</span></label>
            <select id="lic-tipo" v-model="form.tipo_licencia_id" :class="[inputClass, fieldError('tipo_licencia_id') ? errorInputClass : '']">
              <option value="" disabled>Seleccione...</option>
              <option v-for="t in tiposLicencia" :key="t.id" :value="t.id">{{ t.nombre }}{{ t.codigo ? ` (${t.codigo})` : '' }}</option>
            </select>
          </div>
        </div>

        <!-- Bloque 2: Expediente y personas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div class="sm:col-span-2">
            <span :class="labelClass">Expediente de Origen <span class="text-red-500">*</span></span>
            <SearchableSelect
              v-model="form.expediente_id"
              :options="expedientesSelectOptions"
              placeholder="Buscar expediente..."
              search-placeholder="Escriba número de expediente o solicitante..."
            />
            <p v-if="fieldError('expediente_id')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('expediente_id') }}</p>
            <p v-else-if="!expedientesSelectOptions.length" class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">No hay expedientes registrados. Créelos en Operaciones → Expedientes TUPA.</p>
          </div>
          <div>
            <span :class="labelClass">Titular <span class="text-red-500">*</span></span>
            <SearchableSelect v-model="form.titular_id" :options="personasSelectOptions" placeholder="Buscar titular..." search-placeholder="Escriba nombre, razón social o documento..." />
          </div>
          <div>
            <span :class="labelClass">Conductor</span>
            <SearchableSelect v-model="form.conductor_id" :options="personasSelectOptions" placeholder="El mismo titular" search-placeholder="Escriba nombre, razón social o documento..." />
            <p :class="hintClass">Déjelo vacío si el titular conduce el establecimiento.</p>
          </div>
        </div>

        <!-- Bloque 3: Establecimiento -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-4">
          <div>
            <label :class="labelClass" for="lic-nombre">Nombre Comercial <span class="text-red-500">*</span></label>
            <input id="lic-nombre" v-model="form.nombre_comercial" type="text" maxlength="200" placeholder="Ej. BODEGA Y MINIMARKET SANTA ROSA" :class="[inputClass, 'uppercase font-medium', fieldError('nombre_comercial') ? errorInputClass : '']" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label :class="labelClass" for="lic-actividad">Actividad / Giro Declarado <span class="text-red-500">*</span></label>
              <input id="lic-actividad" v-model="form.actividad" type="text" :maxlength="MAX_ACTIVIDAD" placeholder="Ej. VENTA DE ABARROTES" :class="[inputClass, 'uppercase', fieldError('actividad') ? errorInputClass : '']" />
              <p :class="hintClass">{{ form.actividad.length }} / {{ MAX_ACTIVIDAD }} caracteres</p>
            </div>
            <div>
              <label :class="labelClass" for="lic-direccion">Dirección <span class="text-red-500">*</span></label>
              <input id="lic-direccion" v-model="form.direccion" type="text" maxlength="250" placeholder="Ej. AV. NICOLÁS DE PIÉROLA 450" :class="[inputClass, 'uppercase', fieldError('direccion') ? errorInputClass : '']" />
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="col-span-2 sm:col-span-1">
              <label :class="labelClass" for="lic-riesgo">Nivel de Riesgo <span class="text-red-500">*</span></label>
              <select id="lic-riesgo" v-model="form.nivel_riesgo_id" :class="[inputClass, fieldError('nivel_riesgo_id') ? errorInputClass : '']">
                <option value="" disabled>Seleccione...</option>
                <option v-for="nr in nivelesRiesgo" :key="nr.id" :value="nr.id">{{ nr.nombre }} ({{ nr.codigo }})</option>
              </select>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label :class="labelClass" for="lic-zona">Zonificación <span class="text-red-500">*</span></label>
              <select id="lic-zona" v-model="form.zonificacion_id" :class="[inputClass, fieldError('zonificacion_id') ? errorInputClass : '']">
                <option value="" disabled>Seleccione...</option>
                <option v-for="z in zonificaciones" :key="z.id" :value="z.id">{{ z.codigo }} - {{ z.nombre }}</option>
              </select>
            </div>
            <div>
              <label :class="labelClass" for="lic-desde">Abre <span class="text-red-500">*</span></label>
              <select id="lic-desde" v-model.number="form.hora_desde" :class="[inputClass, fieldError('hora_desde') ? errorInputClass : '']">
                <option v-for="h in HORAS" :key="h" :value="h">{{ formatoHora(h) }}</option>
              </select>
            </div>
            <div>
              <label :class="labelClass" for="lic-hasta">Cierra <span class="text-red-500">*</span></label>
              <select id="lic-hasta" v-model.number="form.hora_hasta" :class="[inputClass, fieldError('hora_hasta') ? errorInputClass : '']">
                <option v-for="h in HORAS" :key="h" :value="h">{{ formatoHora(h) }}</option>
              </select>
            </div>
          </div>
          <p v-if="Number(form.hora_hasta) < Number(form.hora_desde)" class="text-[11px] text-blue-700 dark:text-blue-300 -mt-2">
            Horario nocturno: atiende desde las {{ formatoHora(Number(form.hora_desde)) }} hasta las {{ formatoHora(Number(form.hora_hasta)) }} del día siguiente.
          </p>
        </div>

        <!-- Bloque 4: Datos administrativos -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label :class="labelClass" for="lic-area">Área (m²) <span class="text-red-500">*</span></label>
            <input id="lic-area" v-model="form.area" type="number" min="0" step="0.01" placeholder="Ej. 85.50" :class="[inputClass, fieldError('area') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="lic-resolucion">N° de Resolución <span class="text-red-500">*</span></label>
            <input id="lic-resolucion" v-model="form.resolucion_numero" type="text" maxlength="50" placeholder="Ej. 045-2026-SGLC" :class="[inputClass, 'uppercase font-mono', fieldError('resolucion_numero') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="lic-recibo">N° Recibo de Pago <span class="text-red-500">*</span></label>
            <input id="lic-recibo" v-model="form.numero_recibo_pago" type="text" maxlength="20" placeholder="Ej. 0012-45871" :class="[inputClass, 'uppercase font-mono', fieldError('numero_recibo_pago') ? errorInputClass : '']" />
            <p v-if="fieldError('numero_recibo_pago')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('numero_recibo_pago') }}</p>
          </div>
        </div>

        <!-- Bloque 5: Vigencia, publicación y observaciones -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input v-model="form.es_vigencia_indeterminada" type="checkbox" class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500" />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Vigencia indeterminada (Ley N° 28976)</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">Desmárquelo para licencias temporales con fecha de inicio y fin</span>
            </div>
          </label>

          <div v-if="!form.es_vigencia_indeterminada" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label :class="labelClass" for="lic-ini">Inicio de Vigencia <span class="text-red-500">*</span></label>
              <input id="lic-ini" v-model="form.fecha_inicio_vigencia" type="date" :class="[inputClass, fieldError('fecha_inicio_vigencia') ? errorInputClass : '']" />
            </div>
            <div>
              <label :class="labelClass" for="lic-fin">Fin de Vigencia <span class="text-red-500">*</span></label>
              <input id="lic-fin" v-model="form.fecha_fin_vigencia" type="date" :min="form.fecha_inicio_vigencia || undefined" :class="[inputClass, fieldError('fecha_fin_vigencia') ? errorInputClass : '']" />
            </div>
          </div>

          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input v-model="form.se_puede_publicar" type="checkbox" class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 focus:ring-blue-500" />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Publicable en la consulta ciudadana</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">La licencia podrá ser verificada por el público en el portal municipal</span>
            </div>
          </label>

          <div>
            <label :class="labelClass" for="lic-obs">Observaciones</label>
            <textarea id="lic-obs" v-model="form.observaciones" rows="2" placeholder="Condiciones especiales de operación, referencias..." :class="[inputClass, 'resize-none']"></textarea>
          </div>
        </div>
      </div>
    </LargeModal>

    <!-- Inactivación de licencia -->
    <LargeModal
      v-model="isInactivarOpen"
      title="Inactivar Licencia de Funcionamiento"
      :subtitle="licenciaAInactivar ? `Licencia N° ${licenciaAInactivar.numero_licencia} · ${licenciaAInactivar.nombre_comercial}` : ''"
      maxWidth="max-w-lg"
      :is-loading="inactivarLicencia.isPending.value"
      :is-edit-mode="true"
      submit-text="Inactivar Licencia"
      @submit="handleSubmitInactivar"
    >
      <div v-if="inactivarError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl" role="alert">
        {{ inactivarError }}
      </div>
      <p class="text-xs text-amber-800 dark:text-amber-300 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
        La licencia dejará de estar vigente. El registro se conserva en el historial y esta acción no se puede deshacer desde el sistema.
      </p>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label :class="labelClass" for="lic-inact-estado">Motivo <span class="text-red-500">*</span></label>
          <select id="lic-inact-estado" v-model="inactivarForm.estado_id" :class="inputClass">
            <option value="" disabled>Seleccione...</option>
            <option v-for="e in estadosInactivos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
          </select>
          <p v-if="!estadosInactivos.length" class="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
            No hay estados inactivos para licencias. Regístrelos en Administración → Estados.
          </p>
        </div>
        <div>
          <label :class="labelClass" for="lic-inact-fecha">Fecha <span class="text-red-500">*</span></label>
          <input id="lic-inact-fecha" v-model="inactivarForm.fecha_estado" type="date" :class="inputClass" />
        </div>
      </div>
      <div>
        <label :class="labelClass" for="lic-inact-doc">Documento de Sustento <span class="text-red-500">*</span></label>
        <input id="lic-inact-doc" v-model="inactivarForm.documento" type="text" maxlength="100" placeholder="Ej. RESOLUCIÓN N° 120-2026-SGLC" :class="[inputClass, 'uppercase']" />
      </div>
      <div>
        <label :class="labelClass" for="lic-inact-obs">Observaciones <span class="text-red-500">*</span></label>
        <textarea id="lic-inact-obs" v-model="inactivarForm.observaciones" rows="3" maxlength="1000" placeholder="Motivo detallado de la inactivación..." :class="[inputClass, 'resize-none']"></textarea>
      </div>
    </LargeModal>
  </div>
</template>
