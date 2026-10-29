<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  useActasDeExpediente,
  useActualizarAsignacion,
  useAsignarInspector,
  useHistorialAsignaciones,
  useInspectoresDisponibles,
  usePorInspeccionar,
  useReasignarInspector,
} from '../../application/composables/useInspecciones';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import ModalShell from '../components/molecules/ModalShell.vue';
import Skeleton from '../components/atoms/Skeleton.vue';
import ActaInspeccionDetalle from '../components/organisms/ActaInspeccionDetalle.vue';
import SelectorAcompanantes from '../components/molecules/SelectorAcompanantes.vue';
import DenegatoriaModal from '../components/organisms/DenegatoriaModal.vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import { useToast, extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { diasHasta, formatoFecha, hoyISO } from '../utils/fechas';
import type { AcompananteInspeccion, ExpedientePorInspeccionar } from '../../domain/entities/Inspecciones.entity';

/**
 * Jefe de ITSE: reparte entre los inspectores los expedientes que esperan su inspección.
 * Cada inspección tiene un responsable (registra el acta) y puede llevar acompañantes.
 * Reasignar deja constancia de la asignación anterior y su motivo (nada se borra).
 */
type Filtro = 'todos' | 'sin_asignar' | 'asignados';

const toast = useToast();
const { data, isLoading, isError, error } = usePorInspeccionar();
const { data: inspectoresData } = useInspectoresDisponibles();
const asignar = useAsignarInspector();
const actualizar = useActualizarAsignacion();
const reasignar = useReasignarInspector();

const expedientes = computed<ExpedientePorInspeccionar[]>(() => data.value ?? []);
const inspectores = computed(() => inspectoresData.value ?? []);

const filtro = ref<Filtro>('todos');
const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'sin_asignar', texto: 'Sin asignar' },
  { valor: 'asignados', texto: 'Asignados' },
];

/** Aprobado o Desaprobado: no hay más visitas, la oficina emite o deniega */
const tieneDictamenFinal = (e: ExpedientePorInspeccionar) =>
  e.ultima_acta_resultado === 'APROBADO' || e.ultima_acta_resultado === 'DESAPROBADO';

const conteo = computed(() => ({
  total: expedientes.value.length,
  sinAsignar: expedientes.value.filter((e) => e.asignacion_id === null).length,
  inspectorInactivo: expedientes.value.filter((e) => e.asignacion_id !== null && e.inspector_activo === false && !tieneDictamenFinal(e)).length,
  aprobados: expedientes.value.filter((e) => e.ultima_acta_resultado === 'APROBADO').length,
  desaprobados: expedientes.value.filter((e) => e.ultima_acta_resultado === 'DESAPROBADO').length,
}));

const estado = (e: ExpedientePorInspeccionar) => {
  switch (e.ultima_acta_resultado) {
    case 'APROBADO':
      return 'Aprobado: emitir certificado';
    case 'DESAPROBADO':
      return 'Desaprobado: registrar denegatoria';
    case 'OBSERVADO':
      return e.fecha_limite_subsanacion ? `Observado: reinspección (plazo ${formatoFecha(e.fecha_limite_subsanacion)})` : 'Observado: reinspección';
    default:
      if (e.asignacion_id === null) return 'Sin asignar';
      return e.acta_anulada_numero ? `Por visitar (acta N° ${e.acta_anulada_numero} anulada)` : 'Por visitar';
  }
};

const actaAbierta = ref<number | null>(null);
// Solo la última acta vigente, y solo mientras la oficina no emita el certificado o la denegatoria
// (esos expedientes ya no figuran en esta lista)
const actasAnulables = computed(() => new Set(expedientes.value.map((e) => e.ultima_acta_id).filter((id) => id !== null)));

// Desaprobado: la denegatoria la registra quien tiene el acceso de ITSE (el servidor lo exige)
const auth = useAuthStore();
const puedeDenegar = computed(() => auth.puede(['itse']));
const aDenegar = ref<ExpedientePorInspeccionar | null>(null);
const abrirDenegatoria = (e: ExpedientePorInspeccionar) => {
  aDenegar.value = e;
};

const vence = (fecha: string) => {
  const d = diasHasta(fecha);
  if (d < 0) return `${formatoFecha(fecha)} (venció)`;
  if (d === 0) return `${formatoFecha(fecha)} (hoy)`;
  return `${formatoFecha(fecha)} (${d} ${d === 1 ? 'día' : 'días'})`;
};

const nombresEquipo = (acompanantes: AcompananteInspeccion[]) =>
  acompanantes.map((a) => (a.activo === false ? `${a.nombre} (desactivado)` : a.nombre)).join(', ');

const columns = [
  { key: 'numero_expediente', label: 'EXPEDIENTE' },
  { key: 'solicitante', label: 'SOLICITANTE' },
  { key: 'procedimiento', label: 'PROCEDIMIENTO' },
  { key: 'vence', label: 'VENCE' },
  { key: 'inspector', label: 'INSPECTOR' },
  { key: 'visita', label: 'VISITA' },
  { key: 'estado', label: 'ESTADO' },
];

const filas = computed(() =>
  expedientes.value
    .filter((e) =>
      filtro.value === 'todos' ? true : filtro.value === 'sin_asignar' ? e.asignacion_id === null : e.asignacion_id !== null,
    )
    .map((e) => ({
      ...e,
      id: e.expediente_id,
      vence: vence(e.fecha_vencimiento),
      inspector:
        e.asignacion_id === null
          ? 'Sin asignar'
          : (e.inspector_activo === false ? `${e.inspector_nombre} (desactivado)` : e.inspector_nombre) +
            (e.acompanantes.length ? ` · con ${nombresEquipo(e.acompanantes)}` : ''),
      visita: e.asignacion_id === null || tieneDictamenFinal(e) ? '—' : e.fecha_programada ? formatoFecha(e.fecha_programada) : 'Por coordinar',
      estado: estado(e),
      final: tieneDictamenFinal(e),
    })),
);

const textoVacio = computed(() =>
  filtro.value === 'sin_asignar'
    ? 'Todos los expedientes que esperan inspección ya tienen inspector.'
    : filtro.value === 'asignados'
      ? 'Todavía no hay inspecciones asignadas.'
      : 'No hay expedientes esperando inspección ITSE.',
);

// ── Asignar / reprogramar ──────────────────────────────────────────────────
const formOpen = ref(false);
const formError = ref<string | null>(null);
const actual = ref<ExpedientePorInspeccionar | null>(null);
const form = ref({
  inspector_id: null as number | null,
  acompanantes: [] as number[],
  nombre_comercial: '',
  direccion: '',
  fecha_programada: '',
  indicaciones: '',
});
const esReprogramacion = computed(() => actual.value?.asignacion_id != null);
const responsableForm = computed(() => (esReprogramacion.value ? (actual.value?.inspector_id ?? null) : form.value.inspector_id));

const abrirAsignar = (e: ExpedientePorInspeccionar) => {
  actual.value = e;
  formError.value = null;
  form.value = {
    inspector_id: e.inspector_id,
    acompanantes: e.acompanantes.map((a) => a.id),
    nombre_comercial: e.nombre_comercial ?? e.sugerido_nombre_comercial,
    direccion: e.direccion ?? e.sugerido_direccion,
    fecha_programada: e.fecha_programada ?? '',
    indicaciones: e.indicaciones ?? '',
  };
  formOpen.value = true;
};

const guardar = () => {
  const e = actual.value;
  if (!e) return;
  formError.value = null;
  if (!esReprogramacion.value && !form.value.inspector_id) {
    formError.value = 'Elija el inspector.';
    return;
  }
  if (!form.value.nombre_comercial.trim() || !form.value.direccion.trim()) {
    formError.value = 'Indique el nombre comercial y la dirección del local.';
    return;
  }
  const datos = {
    nombre_comercial: form.value.nombre_comercial,
    direccion: form.value.direccion,
    fecha_programada: form.value.fecha_programada || null,
    indicaciones: form.value.indicaciones || null,
    // Si el responsable elegido estaba marcado como acompañante, no se envía dos veces
    acompanantes: form.value.acompanantes.filter((id) => id !== responsableForm.value),
  };
  const listo = (texto: string) => () => {
    formOpen.value = false;
    toast.success(texto);
  };
  const fallo = (err: unknown) => {
    formError.value = extractErrorMessage(err, 'No se pudo guardar la asignación');
  };

  if (esReprogramacion.value) {
    actualizar.mutate({ id: e.asignacion_id!, datos }, { onSuccess: listo('Se actualizó la programación y el equipo de la inspección.'), onError: fallo });
  } else {
    asignar.mutate(
      { ...datos, expediente_id: e.expediente_id, inspector_id: form.value.inspector_id! },
      { onSuccess: listo(`Expediente N° ${e.numero_expediente} asignado.`), onError: fallo },
    );
  }
};

// ── Reasignar ──────────────────────────────────────────────────────────────
const reasignarOpen = ref(false);
const reasignarError = ref<string | null>(null);
const reasignacion = ref({ inspector_id: null as number | null, acompanantes: [] as number[], motivo: '', fecha_programada: '', indicaciones: '' });
const otrosInspectores = computed(() => inspectores.value.filter((i) => i.id !== actual.value?.inspector_id));

const abrirReasignar = (e: ExpedientePorInspeccionar) => {
  actual.value = e;
  reasignarError.value = null;
  reasignacion.value = {
    inspector_id: null,
    acompanantes: e.acompanantes.map((a) => a.id),
    motivo: '',
    fecha_programada: '',
    indicaciones: e.indicaciones ?? '',
  };
  reasignarOpen.value = true;
};

const guardarReasignacion = () => {
  const e = actual.value;
  if (!e?.asignacion_id) return;
  reasignarError.value = null;
  if (!reasignacion.value.inspector_id) {
    reasignarError.value = 'Elija el nuevo inspector.';
    return;
  }
  if (reasignacion.value.motivo.trim().length < 10) {
    reasignarError.value = 'Explique el motivo de la reasignación (al menos 10 caracteres).';
    return;
  }
  reasignar.mutate(
    {
      id: e.asignacion_id,
      datos: {
        inspector_id: reasignacion.value.inspector_id,
        acompanantes: reasignacion.value.acompanantes.filter((id) => id !== reasignacion.value.inspector_id),
        motivo: reasignacion.value.motivo,
        fecha_programada: reasignacion.value.fecha_programada || null,
        indicaciones: reasignacion.value.indicaciones || null,
      },
    },
    {
      onSuccess: () => {
        reasignarOpen.value = false;
        toast.success(`Expediente N° ${e.numero_expediente} reasignado.`);
      },
      onError: (err) => {
        reasignarError.value = extractErrorMessage(err, 'No se pudo reasignar');
      },
    },
  );
};

// ── Historial ──────────────────────────────────────────────────────────────
const historialDe = ref<ExpedientePorInspeccionar | null>(null);
const historialId = computed(() => historialDe.value?.expediente_id ?? null);
const { data: historialData, isLoading: cargandoHistorial } = useHistorialAsignaciones(historialId);
const { data: actasHistorial } = useActasDeExpediente(historialId);
const RESULTADO_ACTA = { APROBADO: 'Aprobado', OBSERVADO: 'Observado', DESAPROBADO: 'Desaprobado' } as const;

const fechaHora = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const claseCampo =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200';
const claseEtiqueta = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
</script>

<template>
  <div class="space-y-4">
    <section class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6 space-y-4">
      <div>
        <h1 class="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">Asignación de inspecciones ITSE</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Expedientes que esperan su inspección. Asigne un inspector responsable (y, si hace falta, acompañantes) y programe la visita;
          cada inspector solo ve las inspecciones en las que participa.
        </p>
      </div>

      <div class="flex flex-col md:flex-row md:items-center gap-3">
        <div class="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Mostrar">
          <button
            v-for="f in FILTROS"
            :key="f.valor"
            type="button"
            role="radio"
            :aria-checked="filtro === f.valor"
            :class="[
              'px-3 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
              filtro === f.valor
                ? 'border-[#0d6efd] bg-[#0d6efd] text-white'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
            ]"
            @click="filtro = f.valor"
          >
            {{ f.texto }}
          </button>
        </div>

        <div v-if="!isLoading && !isError" class="flex flex-wrap gap-2 text-xs md:ml-auto">
          <span class="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold">
            {{ conteo.total }} por inspeccionar
          </span>
          <span v-if="conteo.sinAsignar" class="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
            {{ conteo.sinAsignar }} sin inspector
          </span>
          <span v-if="conteo.inspectorInactivo" class="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold">
            {{ conteo.inspectorInactivo }} con inspector desactivado: reasígnelos
          </span>
          <span v-if="conteo.aprobados" class="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold">
            {{ conteo.aprobados }} aprobados: emitir certificado
          </span>
          <span v-if="conteo.desaprobados" class="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold">
            {{ conteo.desaprobados }} desaprobados: registrar denegatoria
          </span>
        </div>
      </div>

      <p v-if="!isLoading && inspectores.length === 0" class="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
        No hay inspectores activos. Regístrelos en <router-link to="/admin/inspectores" class="font-semibold underline">Inspectores</router-link> para poder asignar.
      </p>
    </section>

    <div
      v-if="isError"
      role="alert"
      class="p-4 text-center text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl"
    >
      No se pudo cargar el listado: {{ extractErrorMessage(error) }}
    </div>

    <CrudTable
      v-else
      title="Expedientes por inspeccionar"
      :columns="columns"
      :data="filas"
      :is-loading="isLoading"
      :texto-vacio="textoVacio"
      :fila-bloqueada="() => true"
      sin-alta
      placeholder-busqueda="Buscar por expediente, solicitante o inspector…"
    >
      <template #acciones-fila="{ row }">
        <template v-if="row.asignacion_id === null">
          <button type="button" class="text-[#0d6efd] dark:text-blue-400 font-semibold hover:underline cursor-pointer" @click="abrirAsignar(row)">
            Asignar
          </button>
        </template>
        <template v-else>
          <!-- Con dictamen final ya no hay visitas que programar ni reasignar -->
          <template v-if="!row.final">
            <button type="button" class="text-[#0d6efd] dark:text-blue-400 font-semibold hover:underline cursor-pointer mr-4" @click="abrirAsignar(row)">
              Programar / equipo
            </button>
            <button type="button" class="text-amber-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer mr-4" @click="abrirReasignar(row)">
              Reasignar
            </button>
          </template>
          <button
            v-if="row.ultima_acta_id"
            type="button"
            class="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer mr-4"
            @click="actaAbierta = row.ultima_acta_id"
          >
            Ver acta
          </button>
          <button
            v-if="row.ultima_acta_resultado === 'DESAPROBADO' && puedeDenegar"
            type="button"
            class="text-red-700 dark:text-red-400 font-semibold hover:underline cursor-pointer mr-4"
            @click="abrirDenegatoria(row)"
          >
            Registrar denegatoria
          </button>
          <button type="button" class="text-neutral-600 dark:text-neutral-300 font-semibold hover:underline cursor-pointer" @click="historialDe = row">
            Historial
          </button>
        </template>
      </template>
    </CrudTable>

    <!-- Asignar o reprogramar -->
    <LargeModal
      v-model="formOpen"
      :title="esReprogramacion ? 'Programar inspección' : 'Asignar inspector'"
      :subtitle="actual ? `Expediente N° ${actual.numero_expediente} · ${actual.solicitante}` : ''"
      max-width="max-w-2xl"
      :is-loading="asignar.isPending.value || actualizar.isPending.value"
      :submit-text="esReprogramacion ? 'Guardar cambios' : 'Asignar'"
      @submit="guardar"
      :guarda-borrador="false"
    >
      <div v-if="formError" role="alert" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl">
        {{ formError }}
      </div>

      <div>
        <label for="asig-inspector" :class="claseEtiqueta">Inspector responsable <span v-if="!esReprogramacion" class="text-red-500">*</span></label>
        <p v-if="esReprogramacion" class="text-sm font-semibold">
          {{ actual?.inspector_nombre }}
          <span class="block text-[11px] font-normal text-neutral-500 dark:text-neutral-400">Para cambiar de responsable use "Reasignar".</span>
        </p>
        <select v-else id="asig-inspector" v-model="form.inspector_id" :class="claseCampo" required>
          <option :value="null" disabled>Elija un inspector</option>
          <option v-for="i in inspectores" :key="i.id" :value="i.id">
            {{ i.nombre }} — {{ i.pendientes }} {{ i.pendientes === 1 ? 'pendiente' : 'pendientes' }}
          </option>
        </select>
      </div>

      <SelectorAcompanantes
        v-model="form.acompanantes"
        :inspectores="inspectores"
        :responsable-id="responsableForm"
        :actuales="actual?.acompanantes"
        id-base="asig-acomp"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="asig-nombre" :class="claseEtiqueta">Nombre comercial <span class="text-red-500">*</span></label>
          <input id="asig-nombre" v-model="form.nombre_comercial" type="text" maxlength="250" required :class="claseCampo" placeholder="Ej. BODEGA EL SOL" />
        </div>
        <div>
          <label for="asig-fecha" :class="claseEtiqueta">Fecha de visita</label>
          <input id="asig-fecha" v-model="form.fecha_programada" type="date" :min="hoyISO()" :class="claseCampo" />
          <span class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Vacía = el inspector la coordina con el solicitante.</span>
        </div>
      </div>

      <div>
        <label for="asig-direccion" :class="claseEtiqueta">Dirección del local <span class="text-red-500">*</span></label>
        <input id="asig-direccion" v-model="form.direccion" type="text" maxlength="250" required :class="claseCampo" />
        <span v-if="!esReprogramacion" class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
          Propuesta desde la licencia del expediente o, si no tiene, desde el domicilio del solicitante. Verifíquela.
        </span>
      </div>

      <div>
        <label for="asig-indicaciones" :class="claseEtiqueta">Indicaciones para el inspector</label>
        <textarea id="asig-indicaciones" v-model="form.indicaciones" rows="3" maxlength="500" :class="claseCampo" placeholder="Ej. Coordinar con el administrador; el local abre desde las 9:00." />
      </div>
    </LargeModal>

    <!-- Reasignar -->
    <LargeModal
      v-model="reasignarOpen"
      title="Reasignar inspección"
      :subtitle="actual ? `Expediente N° ${actual.numero_expediente} · ahora: ${actual.inspector_nombre}` : ''"
      max-width="max-w-2xl"
      :is-loading="reasignar.isPending.value"
      submit-text="Reasignar"
      @submit="guardarReasignacion"
      :guarda-borrador="false"
    >
      <div v-if="reasignarError" role="alert" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl">
        {{ reasignarError }}
      </div>

      <p class="text-xs text-neutral-600 dark:text-neutral-400">
        La asignación actual queda en el historial con el motivo que indique; el responsable anterior deja de verla en su bandeja.
        Si elige como responsable a un acompañante, deja de figurar como acompañante.
      </p>

      <div>
        <label for="reasig-inspector" :class="claseEtiqueta">Nuevo responsable <span class="text-red-500">*</span></label>
        <select id="reasig-inspector" v-model="reasignacion.inspector_id" :class="claseCampo" required>
          <option :value="null" disabled>Elija un inspector</option>
          <option v-for="i in otrosInspectores" :key="i.id" :value="i.id">
            {{ i.nombre }} — {{ i.pendientes }} {{ i.pendientes === 1 ? 'pendiente' : 'pendientes' }}
          </option>
        </select>
      </div>

      <SelectorAcompanantes
        v-model="reasignacion.acompanantes"
        :inspectores="inspectores"
        :responsable-id="reasignacion.inspector_id"
        :actuales="actual?.acompanantes"
        id-base="reasig-acomp"
      />

      <div>
        <label for="reasig-motivo" :class="claseEtiqueta">Motivo <span class="text-red-500">*</span></label>
        <textarea id="reasig-motivo" v-model="reasignacion.motivo" rows="2" maxlength="500" required :class="claseCampo" placeholder="Ej. El inspector está con descanso médico." />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label for="reasig-fecha" :class="claseEtiqueta">Fecha de visita</label>
          <input id="reasig-fecha" v-model="reasignacion.fecha_programada" type="date" :min="hoyISO()" :class="claseCampo" />
        </div>
        <div>
          <label for="reasig-indicaciones" :class="claseEtiqueta">Indicaciones</label>
          <input id="reasig-indicaciones" v-model="reasignacion.indicaciones" type="text" maxlength="500" :class="claseCampo" />
        </div>
      </div>
    </LargeModal>

    <!-- Historial de asignaciones -->
    <ModalShell :open="historialDe !== null" max-width="max-w-2xl" labelledby="historial-titulo">
      <div class="relative w-full bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
        <div class="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 id="historial-titulo" class="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Historial de asignaciones</h2>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Expediente N° {{ historialDe?.numero_expediente }}</p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            aria-label="Cerrar"
            @click="historialDe = null"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-5 sm:p-6 overflow-y-auto">
          <div v-if="cargandoHistorial" class="space-y-3">
            <Skeleton class="h-16 w-full" />
            <Skeleton class="h-16 w-full" />
          </div>
          <ol v-else class="space-y-3">
            <li
              v-for="a in historialData ?? []"
              :key="a.id"
              :class="[
                'rounded-xl border p-4 text-sm',
                a.vigente ? 'border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-800',
              ]"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-neutral-800 dark:text-neutral-100">{{ a.inspector_nombre }}</span>
                <span v-if="a.vigente" class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#0d6efd] text-white">Vigente</span>
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Asignado el {{ fechaHora(a.fecha_asignacion) }} por {{ a.asignado_por }}
                <template v-if="a.fecha_programada"> · visita {{ formatoFecha(a.fecha_programada) }}</template>
              </p>
              <p v-if="a.acompanantes.length" class="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                Acompañantes: {{ nombresEquipo(a.acompanantes) }}
              </p>
              <p v-if="!a.vigente" class="text-xs text-neutral-600 dark:text-neutral-300 mt-2">
                Reasignado el {{ fechaHora(a.fecha_reasignacion) }} por {{ a.reasignado_por }}: «{{ a.motivo_reasignacion }}»
              </p>
            </li>
          </ol>

          <div v-if="actasHistorial?.length" class="mt-5">
            <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Actas de inspección</h3>
            <ul class="space-y-2">
              <li
                v-for="ac in actasHistorial"
                :key="ac.id"
                :class="[
                  'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm',
                  ac.anulada ? 'border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50' : 'border-neutral-200 dark:border-neutral-800',
                ]"
              >
                <span class="min-w-0">
                  <span :class="['font-semibold', ac.anulada && 'line-through text-neutral-500 dark:text-neutral-400']">N° {{ ac.numero_acta }}</span>
                  · {{ ac.visita === 1 ? '1.ª visita' : 'Reinspección' }} · {{ RESULTADO_ACTA[ac.resultado] }}
                  <span v-if="ac.anulada" class="ml-1 text-[11px] font-bold uppercase text-red-600 dark:text-red-400">Anulada</span>
                  <span class="block text-xs text-neutral-500 dark:text-neutral-400">{{ fechaHora(ac.fecha_visita) }} · {{ ac.inspector_nombre }}<template v-if="ac.acompanantes.length"> con {{ nombresEquipo(ac.acompanantes) }}</template></span>
                  <span v-if="ac.anulada" class="block text-xs text-neutral-600 dark:text-neutral-300 break-words">
                    Anulada el {{ fechaHora(ac.fecha_anulacion) }} por {{ ac.anulado_por }}: «{{ ac.motivo_anulacion }}»
                  </span>
                </span>
                <button type="button" class="text-[#0d6efd] dark:text-blue-400 font-semibold hover:underline cursor-pointer shrink-0" @click="actaAbierta = ac.id">
                  Ver
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </ModalShell>

    <DenegatoriaModal
      :expediente="aDenegar ? { id: aDenegar.expediente_id, numero: aDenegar.numero_expediente } : null"
      :tipos="['ITSE']"
      :observaciones-sugeridas="
        aDenegar ? `Reinspección desaprobada según acta de inspección N° ${aDenegar.ultima_acta_numero}: no se subsanaron las observaciones.` : undefined
      "
      @close="aDenegar = null"
    />

    <ActaInspeccionDetalle
      :acta-id="actaAbierta"
      vista="oficina"
      :puede-anular="actaAbierta !== null && actasAnulables.has(actaAbierta)"
      @close="actaAbierta = null"
    />
  </div>
</template>
