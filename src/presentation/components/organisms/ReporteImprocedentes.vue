<script setup lang="ts">
/** Reporte para el OCI: expedientes de licencia o ITSE declarados improcedentes, con su sustento. */
import { computed, ref, watch } from 'vue';
import CrudTable from './CrudTable.vue';
import SelectorPeriodo from '../molecules/SelectorPeriodo.vue';
import Skeleton from '../atoms/Skeleton.vue';
import { useReporteImprocedentes } from '../../../application/composables/useReportes';
import { extractErrorMessage } from '../../../infrastructure/store/useNotificationStore';
import { descargarCsv } from '../../utils/csv';
import { formatoFecha, nombrePeriodo, rangoMes } from '../../utils/fechas';
import type { Improcedencia, TipoAuditoria } from '../../../domain/entities/Reportes.entity';

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
const reporte = useReporteImprocedentes(tipo, rango);

const columnas = [
  { key: 'fecha_rechazo', label: 'FECHA' },
  { key: 'numero_expediente', label: 'N° EXPEDIENTE' },
  { key: 'procedimiento', label: 'PROCEDIMIENTO' },
  { key: 'solicitante', label: 'SOLICITANTE' },
  { key: 'documento_solicitante', label: 'RUC / DNI' },
  { key: 'documento', label: 'RESOLUCIÓN' },
  { key: 'motivo', label: 'MOTIVO' },
  { key: 'registrado_por', label: 'REGISTRADO POR' },
];
const filas = computed(() =>
  (reporte.data.value?.registros ?? []).map((r, i) => ({
    ...r,
    id: i + 1,
    fecha_rechazo: formatoFecha(r.fecha_rechazo),
    documento_solicitante: r.documento_solicitante || '—',
    motivo: r.motivo || '—',
  })),
);

const exportar = () =>
  descargarCsv<Improcedencia>(`improcedentes_${tipo.value}_${rango.value.desde}_${rango.value.hasta}`, [
    { titulo: 'Fecha de rechazo', valor: (r) => formatoFecha(r.fecha_rechazo) },
    { titulo: 'N° Expediente', valor: (r) => r.numero_expediente },
    { titulo: 'Fecha de recepción', valor: (r) => formatoFecha(r.fecha_recepcion) },
    { titulo: 'Procedimiento', valor: (r) => r.procedimiento },
    { titulo: 'Solicitante', valor: (r) => r.solicitante },
    { titulo: 'RUC / DNI', valor: (r) => r.documento_solicitante },
    { titulo: 'Resolución', valor: (r) => r.documento },
    { titulo: 'Motivo', valor: (r) => r.motivo },
    { titulo: 'Registrado por', valor: (r) => r.registrado_por },
    { titulo: 'Fecha de registro', valor: (r) => r.fecha_registro },
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
      <div :class="[tarjeta, 'flex items-center gap-6']">
        <div>
          <p class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Expedientes improcedentes</p>
          <Skeleton v-if="reporte.isLoading.value" class="h-9 w-12 mt-3" rounded="lg" />
          <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-2">{{ reporte.data.value?.resumen.total ?? 0 }}</p>
        </div>
        <p class="text-xs text-neutral-500 dark:text-neutral-400">
          {{ tipo === 'licencias' ? 'Solicitudes de licencia' : 'Solicitudes de ITSE' }} denegadas —
          <span class="first-letter:uppercase inline-block">{{ nombrePeriodo(rango) }}</span>
        </p>
      </div>

      <CrudTable
        :title="`Expedientes improcedentes — ${nombreTipo(tipo)}`"
        :columns="columnas"
        :data="filas"
        :is-loading="reporte.isLoading.value"
        texto-vacio="No hubo expedientes improcedentes en el periodo elegido."
        solo-lectura
      />
    </template>
  </div>
</template>
