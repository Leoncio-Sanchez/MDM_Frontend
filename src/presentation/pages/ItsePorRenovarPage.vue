<script setup lang="ts">
import { computed, ref } from 'vue';
import { useItsePorRenovar } from '../../application/composables/useItse';
import { usePersonasList } from '../../application/composables/usePersonas';
import CrudTable from '../components/organisms/CrudTable.vue';
import { extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { diasHasta, formatoFecha, hoyISO, sumarDias } from '../utils/fechas';
import type { FiltroPorRenovar, Itse } from '../../domain/entities/Itse.entity';
import type { Personas } from '../../domain/entities/Personas.entity';

/**
 * ITSE que caducan pronto y aún no se renovaron: sirve para avisar a los negocios
 * antes de que venza su certificado (todo certificado ITSE vence a los 2 años).
 */
const OPCIONES_DIAS = [15, 30, 60, 90];
/** Al incluir vencidos, cuánto hacia atrás se busca */
const DIAS_VENCIDOS_ATRAS = 365;

const dias = ref(30);
const incluirVencidos = ref(false);

const filtro = computed<FiltroPorRenovar>(() =>
  incluirVencidos.value
    ? { fecha_desde: sumarDias(hoyISO(), -DIAS_VENCIDOS_ATRAS), fecha_hasta: sumarDias(hoyISO(), dias.value) }
    : { dias: dias.value },
);

const { data, isLoading, isError, error } = useItsePorRenovar(filtro);
const { data: personasData } = usePersonasList();

const itse = computed<Itse[]>(() => data.value ?? []);

const nombrePersona = (p?: Personas) =>
  !p ? '' : p.tipo_persona === 'J' ? p.nombres : [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');
const personasById = computed(() => new Map((personasData.value ?? []).map((p: Personas) => [p.id, p])));

const situacion = (fechaCaducidad: string) => {
  const d = diasHasta(fechaCaducidad);
  if (d < 0) return `Venció hace ${-d} ${d === -1 ? 'día' : 'días'}`;
  if (d === 0) return 'Vence hoy';
  return `Vence en ${d} ${d === 1 ? 'día' : 'días'}`;
};

const conteo = computed(() => {
  const restantes = itse.value.map((i) => diasHasta(i.fecha_caducidad));
  return {
    total: restantes.length,
    vencidos: restantes.filter((d) => d < 0).length,
    urgentes: restantes.filter((d) => d >= 0 && d <= 7).length,
  };
});

const columns = [
  { key: 'numero_itse', label: 'N° ITSE' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'titular', label: 'TITULAR' },
  { key: 'direccion', label: 'DIRECCIÓN' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'fecha_caducidad', label: 'CADUCA' },
  { key: 'situacion', label: 'SITUACIÓN' },
];

const filas = computed(() =>
  itse.value.map((i) => ({
    id: i.id,
    numero_itse: i.numero_itse,
    nombre_comercial: i.nombre_comercial,
    titular: nombrePersona(personasById.value.get(Number(i.titular))) || '—',
    direccion: i.direccion || '—',
    tipo: Number(i.tipo_itse_id) === 2 ? 'Renovación' : 'Estándar',
    fecha_caducidad: formatoFecha(i.fecha_caducidad),
    situacion: situacion(i.fecha_caducidad),
  })),
);

const textoVacio = computed(() =>
  incluirVencidos.value
    ? `No hay certificados vencidos ni que venzan en los próximos ${dias.value} días sin renovarse.`
    : `Ningún certificado vence en los próximos ${dias.value} días.`,
);
</script>

<template>
  <div class="space-y-4">
    <!-- Filtros -->
    <section class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6 space-y-4">
      <div>
        <h1 class="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">ITSE por renovar</h1>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Certificados vigentes que vencen pronto y todavía no tienen renovación. Úselo para avisar a los negocios con anticipación.
        </p>
      </div>

      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="flex items-center gap-2 flex-wrap" role="radiogroup" aria-label="Vencen en los próximos">
          <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Vencen en los próximos:</span>
          <button
            v-for="d in OPCIONES_DIAS"
            :key="d"
            type="button"
            role="radio"
            :aria-checked="dias === d"
            :class="[
              'px-3 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
              dias === d
                ? 'border-[#0d6efd] bg-[#0d6efd] text-white'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
            ]"
            @click="dias = d"
          >
            {{ d }} días
          </button>
        </div>

        <label class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 cursor-pointer md:ml-auto">
          <input v-model="incluirVencidos" type="checkbox" class="w-4 h-4 rounded accent-[#0d6efd] cursor-pointer" />
          Incluir los que ya vencieron sin renovarse (último año)
        </label>
      </div>

      <!-- Contadores -->
      <div v-if="!isLoading && !isError && conteo.total > 0" class="flex flex-wrap gap-2 text-xs">
        <span class="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold">
          {{ conteo.total }} {{ conteo.total === 1 ? 'certificado' : 'certificados' }}
        </span>
        <span v-if="conteo.urgentes" class="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
          {{ conteo.urgentes }} vencen en 7 días o menos
        </span>
        <span v-if="conteo.vencidos" class="px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-semibold">
          {{ conteo.vencidos }} ya vencidos
        </span>
      </div>
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
      title="Certificados por vencer"
      :columns="columns"
      :data="filas"
      :is-loading="isLoading"
      :texto-vacio="textoVacio"
      solo-lectura
    />
  </div>
</template>
