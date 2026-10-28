<script setup lang="ts">
/** Reporte para el OCI: licencias o certificados ITSE anulados/revocados, con su resolución y quién lo registró. */
import { computed, ref, watch } from 'vue';
import CrudTable from './CrudTable.vue';
import SelectorPeriodo from '../molecules/SelectorPeriodo.vue';
import Skeleton from '../atoms/Skeleton.vue';
import { useReporteBajas } from '../../../application/composables/useReportes';
import { extractErrorMessage } from '../../../infrastructure/store/useNotificationStore';
import { descargarCsv } from '../../utils/csv';
import { formatoFecha, nombrePeriodo, rangoMes } from '../../utils/fechas';
import type { BajaRegistrada, TipoAuditoria } from '../../../domain/entities/Reportes.entity';

/** Tipos que el usuario puede ver (según sus accesos) */
const props = defineProps<{ tipos: TipoAuditoria[] }>();

const tipo = ref<TipoAuditoria | null>(props.tipos[0] ?? null);
watch(
  () => props.tipos,
  (lista) => {
    if (!tipo.value || !lista.includes(tipo.value)) tipo.value = lista[0] ?? null;
  },
);
const rango = ref(rangoMes(0));
const reporte = useReporteBajas(tipo, rango);
const resumen = computed(() => reporte.data.value?.resumen);

const esLicencia = computed(() => tipo.value === 'licencias');
const etiquetaNumero = computed(() => (esLicencia.value ? 'N° LICENCIA' : 'N° ITSE'));

const columnas = computed(() => [
  { key: 'fecha_estado', label: 'FECHA' },
  { key: 'estado', label: 'ESTADO' },
  { key: 'numero', label: etiquetaNumero.value },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'documento_titular', label: 'RUC / DNI' },
  { key: 'documento', label: 'RESOLUCIÓN' },
  { key: 'motivo', label: 'MOTIVO' },
  { key: 'registrado_por', label: 'REGISTRADO POR' },
]);
const filas = computed(() =>
  (reporte.data.value?.registros ?? []).map((b, i) => ({
    ...b,
    id: i + 1,
    fecha_estado: formatoFecha(b.fecha_estado),
    documento_titular: b.documento_titular || '—',
    motivo: b.motivo || '—',
  })),
);

const exportar = () =>
  descargarCsv<BajaRegistrada>(`bajas_${tipo.value}_${rango.value.desde}_${rango.value.hasta}`, [
    { titulo: 'Fecha de baja', valor: (b) => formatoFecha(b.fecha_estado) },
    { titulo: 'Estado', valor: (b) => b.estado },
    { titulo: esLicencia.value ? 'N° Licencia' : 'N° ITSE', valor: (b) => b.numero },
    { titulo: esLicencia.value ? 'Fecha de emisión' : 'Fecha de expedición', valor: (b) => formatoFecha(b.fecha_emision) },
    { titulo: 'N° Expediente', valor: (b) => b.numero_expediente },
    { titulo: 'Nombre comercial', valor: (b) => b.nombre_comercial },
    { titulo: 'Titular', valor: (b) => b.titular },
    { titulo: 'RUC / DNI', valor: (b) => b.documento_titular },
    { titulo: 'Dirección', valor: (b) => b.direccion },
    { titulo: 'Resolución', valor: (b) => b.documento },
    { titulo: 'Motivo', valor: (b) => b.motivo },
    { titulo: 'Registrado por', valor: (b) => b.registrado_por },
    { titulo: 'Fecha de registro', valor: (b) => b.fecha_registro },
  ], reporte.data.value?.registros ?? []);

const tarjeta = 'bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5';
const botonExportar =
  'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
const botonTipo = (activo: boolean) => [
  'px-3 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
  activo
    ? 'border-[#0B3C5D] bg-[#0B3C5D] text-white'
    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
];
const nombreTipo = (t: TipoAuditoria) => (t === 'licencias' ? 'Licencias de funcionamiento' : 'Certificados ITSE');
// Concordancia: "licencias anuladas" / "certificados anulados"
const titulos = computed(() =>
  esLicencia.value
    ? { encabezado: 'Licencias de funcionamiento dadas de baja', tabla: 'Licencias anuladas o revocadas' }
    : { encabezado: 'Certificados ITSE dados de baja', tabla: 'Certificados ITSE anulados o revocados' },
);
</script>

<template>
  <div class="space-y-4">
    <div :class="[tarjeta, 'space-y-4']">
      <div v-if="tipos.length > 1" class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Mostrar:</span>
        <button v-for="t in tipos" :key="t" type="button" :class="botonTipo(tipo === t)" @click="tipo = t">{{ nombreTipo(t) }}</button>
      </div>
      <div class="flex flex-col lg:flex-row lg:items-end gap-4">
        <SelectorPeriodo v-model="rango" />
        <button type="button" :class="[botonExportar, 'lg:ml-auto self-start lg:self-end']" :disabled="!reporte.data.value?.registros.length" @click="exportar">
          Exportar a Excel
        </button>
      </div>
    </div>

    <p v-if="reporte.isError.value" role="alert" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
      No se pudo cargar el reporte: {{ extractErrorMessage(reporte.error.value) }}
    </p>

    <template v-else-if="tipo">
      <h2 class="text-sm font-bold text-neutral-700 dark:text-neutral-200">
        {{ titulos.encabezado }} —<span class="first-letter:uppercase inline-block">{{ nombrePeriodo(rango) }}</span>
      </h2>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div :class="tarjeta">
          <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Total de bajas</p>
          <Skeleton v-if="reporte.isLoading.value" class="h-9 w-12 mt-3" rounded="lg" />
          <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{{ resumen?.total ?? 0 }}</p>
        </div>
        <template v-if="reporte.isLoading.value">
          <div v-for="n in 2" :key="n" :class="tarjeta"><Skeleton class="h-4 w-20" rounded="md" /><Skeleton class="h-9 w-12 mt-3" rounded="lg" /></div>
        </template>
        <div v-for="e in resumen?.por_estado ?? []" v-else :key="e.estado" :class="tarjeta">
          <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ e.estado }}</p>
          <p class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{{ e.total }}</p>
        </div>
      </div>

      <CrudTable
        :title="titulos.tabla"
        :columns="columnas"
        :data="filas"
        :is-loading="reporte.isLoading.value"
        texto-vacio="No se registraron bajas en el periodo elegido."
        solo-lectura
      />
    </template>
  </div>
</template>
