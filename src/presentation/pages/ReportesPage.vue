<script setup lang="ts">
/**
 * Reportes gerenciales. Basado en la pantalla del Corte 2 (equipo), ampliado a los 3 reportes
 * acordados y con cifras calculadas por el servidor (no valores fijos).
 */
import { computed, ref, watch } from 'vue';
import CrudTable from '../components/organisms/CrudTable.vue';
import Skeleton from '../components/atoms/Skeleton.vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import { usePadronLicencias } from '../../application/composables/useReportes';
import { useItsePorRenovar } from '../../application/composables/useItse';
import { useExpedientesPendientes } from '../../application/composables/useExpedientes';
import { usePersonasList } from '../../application/composables/usePersonas';
import { extractErrorMessage, useToast } from '../../infrastructure/store/useNotificationStore';
import { container } from '../../composition/container';
import { descargarCsv } from '../utils/csv';
import { diasHasta, formatoFecha, hoyISO } from '../utils/fechas';
import type { LicenciaPadron } from '../../domain/entities/Reportes.entity';
import type { FiltroPorRenovar, Itse } from '../../domain/entities/Itse.entity';
import type { ExpedientePendiente } from '../../domain/entities/Expedientes.entity';
import type { Personas } from '../../domain/entities/Personas.entity';

const authStore = useAuthStore();

type Pestana = 'licencias' | 'itse' | 'expedientes';
const pestanas = computed(() =>
  ([
    { id: 'licencias', titulo: 'Padrón de licencias', visible: authStore.puede(['licencias']) },
    { id: 'itse', titulo: 'ITSE por vencer', visible: authStore.puede(['itse']) },
    { id: 'expedientes', titulo: 'Expedientes en riesgo de plazo', visible: authStore.puede(['expedientes', 'licencias', 'itse']) },
  ] as { id: Pestana; titulo: string; visible: boolean }[]).filter((p) => p.visible),
);
const activa = ref<Pestana>(pestanas.value[0]?.id ?? 'expedientes');

// ── 1. Padrón de licencias ───────────────────────────────────────────
const primerDiaMes = (desplazamiento = 0) => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + desplazamiento, 1);
};
const aISO = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const rangoMes = (desplazamiento: number) => {
  const inicio = primerDiaMes(desplazamiento);
  const fin = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  return { desde: aISO(inicio), hasta: aISO(fin) };
};

const rango = ref(rangoMes(0));
const desdeInput = ref(rango.value.desde);
const hastaInput = ref(rango.value.hasta);
const errorRango = ref<string | null>(null);

const aplicarRango = () => {
  if (!desdeInput.value || !hastaInput.value) return (errorRango.value = 'Indique ambas fechas.');
  if (hastaInput.value < desdeInput.value) return (errorRango.value = 'La fecha de fin no puede ser anterior a la de inicio.');
  errorRango.value = null;
  rango.value = { desde: desdeInput.value, hasta: hastaInput.value };
};
const elegirMes = (desplazamiento: number) => {
  rango.value = rangoMes(desplazamiento);
  desdeInput.value = rango.value.desde;
  hastaInput.value = rango.value.hasta;
  errorRango.value = null;
};

const puedeLicencias = computed(() => authStore.puede(['licencias']));
const padron = usePadronLicencias(rango, puedeLicencias);
const resumen = computed(() => padron.data.value?.resumen);

const esMesCompleto = computed(() => {
  const [y, m] = rango.value.desde.split('-').map(Number);
  return rango.value.desde.endsWith('-01') && rango.value.hasta === aISO(new Date(y, m, 0));
});
const nombreMes = computed(() => {
  const [y, m] = rango.value.desde.split('-').map(Number);
  return esMesCompleto.value
    ? new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1))
    : `${formatoFecha(rango.value.desde)} al ${formatoFecha(rango.value.hasta)}`;
});

// Informe formal numerado: solo por mes completo (el servidor lo vuelve a validar)
const toast = useToast();
const generandoPdf = ref(false);
const puedeInformePdf = computed(() => esMesCompleto.value && rango.value.desde <= hoyISO());
const descargarInformePdf = async () => {
  generandoPdf.value = true;
  try {
    const informe = await container.reportes.informeLicenciasPdf(rango.value.desde, rango.value.hasta);
    const url = URL.createObjectURL(informe.contenido);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = informe.nombreArchivo;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    toast.success(
      informe.reimpresion ? 'Este mes ya tenía informe: se reimprimió con el mismo número.' : 'Se generó el informe.',
      `Informe N° ${informe.codigo}`,
    );
  } catch (err) {
    toast.error(extractErrorMessage(err, 'No se pudo generar el informe.'), 'Informe PDF');
  } finally {
    generandoPdf.value = false;
  }
};

const columnasPadron = [
  { key: 'numero_licencia', label: 'N° LICENCIA' },
  { key: 'numero_expediente', label: 'N° EXPEDIENTE' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'documento_titular', label: 'RUC / DNI' },
  { key: 'giros', label: 'GIRO' },
  { key: 'zonificacion', label: 'ZONIFICACIÓN' },
  { key: 'nivel_riesgo', label: 'RIESGO' },
  { key: 'fecha_emision', label: 'EMISIÓN' },
  { key: 'plazo', label: 'ATENCIÓN' },
];
const filasPadron = computed(() =>
  (padron.data.value?.licencias ?? []).map((l) => ({
    ...l,
    id: l.numero_licencia,
    fecha_emision: formatoFecha(l.fecha_emision),
    plazo: `${l.dias_habiles} de ${l.plazo_dias} días hábiles${l.dentro_de_plazo ? '' : ' (fuera de plazo)'}`,
  })),
);

const exportarPadron = () =>
  descargarCsv<LicenciaPadron>(`padron_licencias_${rango.value.desde}_${rango.value.hasta}`, [
    { titulo: 'N° Licencia', valor: (l) => l.numero_licencia },
    { titulo: 'N° Expediente', valor: (l) => l.numero_expediente },
    { titulo: 'Nombre comercial', valor: (l) => l.nombre_comercial },
    { titulo: 'Titular', valor: (l) => l.titular },
    { titulo: 'RUC / DNI', valor: (l) => l.documento_titular },
    { titulo: 'Giro', valor: (l) => l.giros },
    { titulo: 'Zonificación', valor: (l) => l.zonificacion },
    { titulo: 'Nivel de riesgo', valor: (l) => l.nivel_riesgo },
    { titulo: 'Tipo de licencia', valor: (l) => l.tipo_licencia },
    { titulo: 'Fecha de recepción', valor: (l) => formatoFecha(l.fecha_recepcion) },
    { titulo: 'Fecha de emisión', valor: (l) => formatoFecha(l.fecha_emision) },
    { titulo: 'Días hábiles de atención', valor: (l) => l.dias_habiles },
    { titulo: 'Plazo TUPA (días hábiles)', valor: (l) => l.plazo_dias },
    { titulo: 'Dentro de plazo', valor: (l) => (l.dentro_de_plazo ? 'Sí' : 'No') },
  ], padron.data.value?.licencias ?? []);

// ── 2. ITSE por vencer ───────────────────────────────────────────────
const diasItse = ref(30);
const filtroItse = computed<FiltroPorRenovar>(() => ({ dias: diasItse.value }));
const puedeItse = computed(() => authStore.puede(['itse']));
const itse = useItsePorRenovar(filtroItse, puedeItse);
const { data: personasData } = usePersonasList();
const personasById = computed(() => new Map((personasData.value ?? []).map((p: Personas) => [p.id, p])));
const nombrePersona = (id: number) => {
  const p = personasById.value.get(Number(id));
  return !p ? '—' : p.tipo_persona === 'J' ? p.nombres : [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
};
const venceEn = (fecha: string) => {
  const d = diasHasta(fecha);
  return d === 0 ? 'Hoy' : `En ${d} ${d === 1 ? 'día' : 'días'}`;
};
const columnasItse = [
  { key: 'numero_itse', label: 'N° ITSE' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'direccion', label: 'DIRECCIÓN' },
  { key: 'fecha_caducidad', label: 'CADUCA' },
  { key: 'vence', label: 'VENCE' },
];
const filasItse = computed(() =>
  (itse.data.value ?? []).map((i: Itse) => ({
    id: i.id,
    numero_itse: i.numero_itse,
    nombre_comercial: i.nombre_comercial,
    titular: nombrePersona(Number(i.titular)),
    direccion: i.direccion || '—',
    fecha_caducidad: formatoFecha(i.fecha_caducidad),
    vence: venceEn(i.fecha_caducidad),
  })),
);
const exportarItse = () =>
  descargarCsv<Itse>(`itse_por_vencer_${diasItse.value}_dias_${hoyISO()}`, [
    { titulo: 'N° ITSE', valor: (i) => i.numero_itse },
    { titulo: 'Nombre comercial', valor: (i) => i.nombre_comercial },
    { titulo: 'Titular', valor: (i) => nombrePersona(Number(i.titular)) },
    { titulo: 'Dirección', valor: (i) => i.direccion },
    { titulo: 'Fecha de caducidad', valor: (i) => formatoFecha(i.fecha_caducidad) },
    { titulo: 'Vence', valor: (i) => venceEn(i.fecha_caducidad) },
  ], itse.data.value ?? []);

// ── 3. Expedientes en riesgo de plazo ────────────────────────────────
// La recepción llega con hora en UTC: se muestra en la fecha local (Perú), no cortando el texto
const fechaLocal = (iso: string) =>
  iso ? new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso)) : '—';
const pendientes = useExpedientesPendientes();
const enRiesgo = computed(() =>
  ((pendientes.data.value ?? []) as ExpedientePendiente[])
    .filter((e) => e.mostrar_alerta || diasHasta(e.fecha_vencimiento) < 0)
    .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)),
);
const situacionExpediente = (e: ExpedientePendiente) => {
  const restantes = e.dias_habiles_restantes ?? 0;
  if (diasHasta(e.fecha_vencimiento) < 0) return `Vencido (${Math.abs(restantes)} ${Math.abs(restantes) === 1 ? 'día hábil' : 'días hábiles'})`;
  return restantes === 0 ? 'Vence hoy' : `Quedan ${restantes} ${restantes === 1 ? 'día hábil' : 'días hábiles'}`;
};
const columnasExpedientes = [
  { key: 'numero_expediente', label: 'N° EXPEDIENTE' },
  { key: 'nombre', label: 'PROCEDIMIENTO' },
  { key: 'persona_nombre', label: 'SOLICITANTE' },
  { key: 'fecha_recepcion', label: 'RECEPCIÓN' },
  { key: 'fecha_vencimiento', label: 'VENCE' },
  { key: 'situacion', label: 'SITUACIÓN' },
];
const filasExpedientes = computed(() =>
  enRiesgo.value.map((e) => ({
    id: e.id,
    numero_expediente: e.numero_expediente,
    nombre: e.nombre,
    persona_nombre: e.persona_nombre || '—',
    fecha_recepcion: fechaLocal(e.fecha_recepcion),
    fecha_vencimiento: formatoFecha(e.fecha_vencimiento),
    situacion: situacionExpediente(e),
  })),
);
const exportarExpedientes = () =>
  descargarCsv<ExpedientePendiente>(`expedientes_en_riesgo_${hoyISO()}`, [
    { titulo: 'N° Expediente', valor: (e) => e.numero_expediente },
    { titulo: 'Procedimiento', valor: (e) => e.nombre },
    { titulo: 'Solicitante', valor: (e) => e.persona_nombre },
    { titulo: 'Fecha de recepción', valor: (e) => fechaLocal(e.fecha_recepcion) },
    { titulo: 'Fecha límite', valor: (e) => formatoFecha(e.fecha_vencimiento) },
    { titulo: 'Situación', valor: (e) => situacionExpediente(e) },
  ], enRiesgo.value);

// Si el acceso cambia y la pestaña activa ya no corresponde, ir a la primera disponible
watch(pestanas, (lista) => {
  if (!lista.some((p) => p.id === activa.value) && lista[0]) activa.value = lista[0].id;
});

const tarjeta = 'bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5';
const botonExportar =
  'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const botonPdf = botonExportar.replace('bg-emerald-600 hover:bg-emerald-700', 'bg-[#0B3C5D] hover:bg-[#082c45]');
const botonFiltro = (activo: boolean) => [
  'px-3 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
  activo
    ? 'border-[#0d6efd] bg-[#0d6efd] text-white'
    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
];
const esMesActual = computed(() => rango.value.desde === rangoMes(0).desde && rango.value.hasta === rangoMes(0).hasta);
const esMesAnterior = computed(() => rango.value.desde === rangoMes(-1).desde && rango.value.hasta === rangoMes(-1).hasta);
</script>

<template>
  <div class="space-y-4">
    <div>
      <h1 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Reportes</h1>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Informes para control y seguimiento, con exportación a Excel.</p>
    </div>

    <!-- Pestañas -->
    <div role="tablist" class="flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
      <button
        v-for="p in pestanas"
        :key="p.id"
        type="button"
        role="tab"
        :aria-selected="activa === p.id"
        :class="[
          'px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer',
          activa === p.id
            ? 'border-[#0d6efd] text-[#0d6efd] dark:text-blue-400'
            : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200',
        ]"
        @click="activa = p.id"
      >
        {{ p.titulo }}
      </button>
    </div>

    <!-- 1. Padrón de licencias -->
    <section v-if="activa === 'licencias'" role="tabpanel" class="space-y-4">
      <div :class="[tarjeta, 'flex flex-col lg:flex-row lg:items-end gap-4']">
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" :class="botonFiltro(esMesActual)" @click="elegirMes(0)">Este mes</button>
          <button type="button" :class="botonFiltro(esMesAnterior)" @click="elegirMes(-1)">Mes anterior</button>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <label class="text-xs text-neutral-600 dark:text-neutral-300">
            Desde
            <input v-model="desdeInput" type="date" class="block mt-1 h-9 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-sm" />
          </label>
          <label class="text-xs text-neutral-600 dark:text-neutral-300">
            Hasta
            <input v-model="hastaInput" type="date" class="block mt-1 h-9 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-sm" />
          </label>
          <button type="button" :class="botonFiltro(false)" class="h-9" @click="aplicarRango">Aplicar</button>
        </div>
        <div class="flex flex-wrap gap-2 lg:ml-auto">
          <button
            type="button"
            :class="botonPdf"
            :disabled="!puedeInformePdf || generandoPdf"
            :title="puedeInformePdf ? 'Informe mensual numerado, listo para firmar' : 'Elija un mes completo que ya haya empezado'"
            @click="descargarInformePdf"
          >
            {{ generandoPdf ? 'Generando…' : 'Descargar informe PDF' }}
          </button>
          <button type="button" :class="botonExportar" :disabled="!padron.data.value?.licencias.length" @click="exportarPadron">
            Exportar a Excel
          </button>
        </div>
      </div>
      <p v-if="errorRango" role="alert" class="text-xs text-red-600 dark:text-red-400">{{ errorRango }}</p>

      <p v-if="padron.isError.value" role="alert" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        No se pudo cargar el padrón: {{ extractErrorMessage(padron.error.value) }}
      </p>

      <template v-else>
        <h2 class="text-sm font-bold text-neutral-700 dark:text-neutral-200 first-letter:uppercase">Licencias emitidas — {{ nombreMes }}</h2>

        <!-- Resumen -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div :class="tarjeta">
            <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Licencias emitidas</p>
            <Skeleton v-if="padron.isLoading.value" class="h-9 w-16 mt-3" rounded="lg" />
            <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{{ resumen?.total ?? 0 }}</p>
          </div>
          <div :class="tarjeta">
            <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Tiempo promedio de atención</p>
            <Skeleton v-if="padron.isLoading.value" class="h-9 w-24 mt-3" rounded="lg" />
            <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">
              <template v-if="resumen?.tiempo_promedio_dias_habiles !== null && resumen?.tiempo_promedio_dias_habiles !== undefined">
                {{ resumen.tiempo_promedio_dias_habiles.toLocaleString('es-PE') }}
                <span class="text-sm font-medium text-neutral-500">días hábiles</span>
              </template>
              <span v-else class="text-base font-medium text-neutral-400">Sin licencias en el periodo</span>
            </p>
            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">De la recepción del expediente a la emisión</p>
          </div>
          <div :class="tarjeta">
            <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Cumplimiento del plazo TUPA</p>
            <Skeleton v-if="padron.isLoading.value" class="h-9 w-20 mt-3" rounded="lg" />
            <template v-else>
              <p class="text-3xl font-extrabold mt-2" :class="(resumen?.porcentaje_cumplimiento ?? 100) >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
                {{ resumen?.porcentaje_cumplimiento !== null && resumen?.porcentaje_cumplimiento !== undefined ? `${resumen.porcentaje_cumplimiento.toLocaleString('es-PE')} %` : '—' }}
              </p>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                {{ resumen?.dentro_de_plazo ?? 0 }} de {{ resumen?.total ?? 0 }} dentro del plazo de su procedimiento
              </p>
            </template>
          </div>
          <div :class="tarjeta">
            <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Por nivel de riesgo</p>
            <Skeleton v-if="padron.isLoading.value" class="h-16 w-full mt-3" rounded="lg" />
            <ul v-else class="mt-2 space-y-1 text-sm">
              <li v-for="n in resumen?.por_nivel_riesgo ?? []" :key="n.nivel" class="flex justify-between text-neutral-700 dark:text-neutral-200">
                <span class="capitalize">{{ n.nivel.toLowerCase().replace('riesgo ', '') }}</span>
                <span class="font-semibold tabular-nums">{{ n.total }}</span>
              </li>
            </ul>
          </div>
        </div>

        <CrudTable
          title="Padrón de licencias emitidas"
          :columns="columnasPadron"
          :data="filasPadron"
          :is-loading="padron.isLoading.value"
          texto-vacio="No se emitieron licencias en el periodo elegido."
          solo-lectura
        />
      </template>
    </section>

    <!-- 2. ITSE por vencer -->
    <section v-if="activa === 'itse'" role="tabpanel" class="space-y-4">
      <div :class="[tarjeta, 'flex flex-wrap items-center gap-2']">
        <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Vencen en los próximos:</span>
        <button v-for="d in [30, 60, 90]" :key="d" type="button" :class="botonFiltro(diasItse === d)" @click="diasItse = d">{{ d }} días</button>
        <button type="button" :class="[botonExportar, 'sm:ml-auto']" :disabled="!itse.data.value?.length" @click="exportarItse">Exportar a Excel</button>
      </div>
      <p v-if="itse.isError.value" role="alert" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        No se pudo cargar el reporte: {{ extractErrorMessage(itse.error.value) }}
      </p>
      <CrudTable
        v-else
        :title="`Certificados ITSE que vencen en ${diasItse} días`"
        :columns="columnasItse"
        :data="filasItse"
        :is-loading="itse.isLoading.value"
        :texto-vacio="`Ningún certificado vence en los próximos ${diasItse} días.`"
        solo-lectura
      />
    </section>

    <!-- 3. Expedientes en riesgo de plazo -->
    <section v-if="activa === 'expedientes'" role="tabpanel" class="space-y-4">
      <div :class="[tarjeta, 'flex flex-wrap items-center gap-3']">
        <p class="text-xs text-neutral-600 dark:text-neutral-300">
          Expedientes en trámite que ya pasaron su fecha de alerta o su plazo TUPA, del más urgente al menos urgente.
        </p>
        <button type="button" :class="[botonExportar, 'sm:ml-auto']" :disabled="!enRiesgo.length" @click="exportarExpedientes">Exportar a Excel</button>
      </div>
      <p v-if="pendientes.isError.value" role="alert" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
        No se pudo cargar el reporte: {{ extractErrorMessage(pendientes.error.value) }}
      </p>
      <CrudTable
        v-else
        title="Expedientes en riesgo de vencer el plazo"
        :columns="columnasExpedientes"
        :data="filasExpedientes"
        :is-loading="pendientes.isLoading.value"
        texto-vacio="Ningún expediente está en riesgo de vencer su plazo."
        solo-lectura
      />
    </section>
  </div>
</template>
