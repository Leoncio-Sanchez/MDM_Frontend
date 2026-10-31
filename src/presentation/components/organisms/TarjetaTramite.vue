<script setup lang="ts">
import { computed } from 'vue';
import type { TramitePublico } from '../../../domain/entities/ConsultaPublica.entity';

/**
 * Un trámite tal como lo ve el ciudadano (consulta pública y "Mis trámites"): estado,
 * fechas, giros y, en expedientes, en qué va la inspección ITSE. Sin datos personales.
 */
const props = defineProps<{
  tramite: TramitePublico;
  /** Sigue el modo oscuro de la app ("Mis trámites"); la consulta pública es siempre clara */
  sigueTema?: boolean;
}>();

/** Clases del modo claro y, si la tarjeta sigue el tema, las del oscuro */
const tema = (claro: string, oscuro: string) => (props.sigueTema ? `${claro} ${oscuro}` : claro);

/** "2026-01-15" → "15/01/2026" (sin pasar por Date para evitar el desfase de zona horaria) */
const fecha = (valor: string | null | undefined) => (valor ? valor.split('-').reverse().join('/') : '—');

const titulo = computed(() => ({
  expediente: `Expediente N.° ${props.tramite.numero}`,
  licencia: `Licencia de Funcionamiento N.° ${props.tramite.numero}`,
  itse: `Certificado ITSE N.° ${props.tramite.numero}`,
})[props.tramite.tipo]);

const textoPrincipal = computed(() => tema('text-neutral-900', 'dark:text-neutral-100'));
const textoSecundario = computed(() => tema('text-neutral-600', 'dark:text-neutral-300'));

const fechas = computed(() => {
  const t = props.tramite;
  if (t.tipo === 'expediente') {
    return [
      { etiqueta: 'Fecha de ingreso', valor: fecha(t.fecha_emision) },
      { etiqueta: 'Fecha límite de atención', valor: fecha(t.fecha_vencimiento) },
    ];
  }
  return [
    { etiqueta: t.tipo === 'itse' ? 'Fecha de expedición' : 'Fecha de emisión', valor: fecha(t.fecha_emision) },
    { etiqueta: 'Vence', valor: t.vigencia_indeterminada ? 'Vigencia indeterminada' : fecha(t.fecha_vencimiento) },
  ];
});

const ESTADO_AMBAR = ['bg-amber-50 text-amber-800 border-amber-200', 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'] as const;
const ESTADO_VERDE = ['bg-emerald-50 text-emerald-800 border-emerald-200', 'dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'] as const;
const ESTADO_ROJO = ['bg-red-50 text-red-800 border-red-200', 'dark:bg-red-950/40 dark:text-red-300 dark:border-red-800'] as const;
const ESTADO_GRIS = ['bg-neutral-100 text-neutral-700 border-neutral-300', 'dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'] as const;

const COLOR_ESTADO: Record<TramitePublico['estado'], readonly [string, string]> = {
  'EN TRÁMITE': ESTADO_AMBAR,
  ATENDIDO: ESTADO_VERDE,
  VIGENTE: ESTADO_VERDE,
  IMPROCEDENTE: ESTADO_ROJO,
  VENCIDO: ESTADO_ROJO,
  ANULADO: ESTADO_GRIS,
  INACTIVO: ESTADO_GRIS,
};

const EXPLICACION: Record<TramitePublico['estado'], string> = {
  'EN TRÁMITE': 'Su trámite está siendo evaluado por la municipalidad.',
  ATENDIDO: 'Su trámite ya fue atendido.',
  IMPROCEDENTE: 'Su solicitud fue declarada improcedente. Acérquese a la municipalidad para más información.',
  ANULADO: 'El expediente fue anulado. Acérquese a la municipalidad para más información.',
  VIGENTE: 'El documento se encuentra vigente.',
  VENCIDO: 'El documento venció. Debe solicitar su renovación.',
  INACTIVO: 'El documento no se encuentra activo. Acérquese a la municipalidad para más información.',
};

/** Lo que el ciudadano necesita saber de la inspección: cuándo lo visitan y hasta cuándo subsanar */
const inspeccion = computed(() => {
  const i = props.tramite.inspeccion;
  if (!i) return null;
  switch (i.estado) {
    case 'POR_ASIGNAR':
      return { tono: 'info', texto: 'Inspección ITSE pendiente: la municipalidad programará la visita a su local.' };
    case 'POR_PROGRAMAR':
      return { tono: 'info', texto: 'Inspección ITSE: el inspector coordinará con usted la fecha de la visita.' };
    case 'PROGRAMADA':
      return { tono: 'info', texto: `Inspección ITSE programada para el ${fecha(i.fecha)}. Esté presente en el local ese día.` };
    case 'OBSERVADA':
      return {
        tono: 'alerta',
        texto: `La inspección encontró observaciones. Corríjalas hasta el ${fecha(i.fecha)}: después se hará la reinspección. Si tiene dudas, acérquese a la municipalidad.`,
      };
    case 'APROBADA':
      return { tono: 'ok', texto: 'Inspección ITSE aprobada: la municipalidad está emitiendo su certificado.' };
    case 'DESAPROBADA':
      return { tono: 'error', texto: 'La reinspección no fue aprobada. Acérquese a la municipalidad para más información.' };
  }
  return null;
});

const COLOR_INSPECCION: Record<string, readonly [string, string]> = {
  info: ['bg-sky-50 border-sky-200 text-sky-900', 'dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200'],
  alerta: ['bg-amber-50 border-amber-300 text-amber-900', 'dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'],
  ok: ['bg-emerald-50 border-emerald-200 text-emerald-900', 'dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200'],
  error: ['bg-red-50 border-red-200 text-red-800', 'dark:bg-red-950/40 dark:border-red-800 dark:text-red-200'],
};
</script>

<template>
  <article :class="['rounded-2xl border shadow-xs p-5 sm:p-6', tema('bg-white border-neutral-200', 'dark:bg-[#18181b] dark:border-neutral-800')]">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <h3 :class="['text-base font-bold', tema('text-neutral-900', 'dark:text-white')]">{{ titulo }}</h3>
        <p v-if="tramite.nombre_comercial" :class="['text-sm mt-0.5', textoSecundario]">{{ tramite.nombre_comercial }}</p>
        <p v-if="tramite.procedimiento" :class="['text-sm mt-0.5', textoSecundario]">{{ tramite.procedimiento }}</p>
      </div>
      <span :class="['self-start shrink-0 px-3 py-1 rounded-full border text-xs font-bold tracking-wide', tema(...COLOR_ESTADO[tramite.estado])]">
        {{ tramite.estado }}
      </span>
    </div>

    <p :class="['text-sm mt-3', textoSecundario]">{{ EXPLICACION[tramite.estado] }}</p>

    <p v-if="inspeccion" role="note" :class="['mt-3 rounded-xl border px-4 py-3 text-sm', tema(...COLOR_INSPECCION[inspeccion.tono])]">
      {{ inspeccion.texto }}
    </p>

    <dl :class="['grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t', tema('border-neutral-100', 'dark:border-neutral-800')]">
      <div v-for="f in fechas" :key="f.etiqueta">
        <dt :class="['text-[11px] uppercase tracking-wide font-semibold', tema('text-neutral-500', 'dark:text-neutral-400')]">{{ f.etiqueta }}</dt>
        <dd :class="['text-sm font-medium', textoPrincipal]">{{ f.valor }}</dd>
      </div>
      <div v-if="tramite.giros.length" class="sm:col-span-2">
        <dt :class="['text-[11px] uppercase tracking-wide font-semibold', tema('text-neutral-500', 'dark:text-neutral-400')]">Giro comercial</dt>
        <dd :class="['text-sm', textoPrincipal]">{{ tramite.giros.join(' · ') }}</dd>
      </div>
    </dl>
  </article>
</template>
