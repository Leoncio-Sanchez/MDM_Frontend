<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMiBandeja } from '../../application/composables/useInspecciones';
import Skeleton from '../components/atoms/Skeleton.vue';
import ActaInspeccionDetalle from '../components/organisms/ActaInspeccionDetalle.vue';
import { extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import { diasHasta, formatoFecha } from '../utils/fechas';
import type { AsignacionInspeccion } from '../../domain/entities/Inspecciones.entity';

/**
 * Bandeja del inspector de campo: las inspecciones que el jefe de ITSE le asignó como
 * responsable o acompañante y que aún no se resuelven. Ordenadas por fecha de visita y
 * luego por vencimiento. El acta la registra solo el responsable.
 */
const { data, isLoading, isError, error } = useMiBandeja();
const inspecciones = computed<AsignacionInspeccion[]>(() => data.value ?? []);

const conteo = computed(() => ({
  total: inspecciones.value.length,
  hoy: inspecciones.value.filter((i) => i.fecha_programada && diasHasta(i.fecha_programada) === 0).length,
  porCoordinar: inspecciones.value.filter((i) => !i.fecha_programada).length,
}));

const visita = (i: AsignacionInspeccion) => {
  if (!i.fecha_programada) return { texto: 'Por coordinar con el solicitante', clase: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200' };
  const d = diasHasta(i.fecha_programada);
  if (d < 0) return { texto: `Visita atrasada (${formatoFecha(i.fecha_programada)})`, clase: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' };
  if (d === 0) return { texto: 'Visita hoy', clase: 'bg-[#0d6efd] text-white' };
  return { texto: `Visita el ${formatoFecha(i.fecha_programada)}`, clase: 'bg-blue-50 dark:bg-blue-950/40 text-[#0d6efd] dark:text-blue-300' };
};

/** Observada en la 1.ª visita: toca la reinspección cuando venza el plazo de subsanación */
const esReinspeccion = (i: AsignacionInspeccion) => i.ultima_acta_resultado === 'OBSERVADO';
const actaAbierta = ref<number | null>(null);

const auth = useAuthStore();
/** Para el acompañante: quiénes más van, sin contarlo a él */
const otrosAcompanantes = (i: AsignacionInspeccion) =>
  i.acompanantes.filter((a) => String(a.id) !== String(auth.user?.id)).map((a) => a.nombre);

const plazo = (fecha: string) => {
  const d = diasHasta(fecha);
  if (d < 0) return `El expediente venció el ${formatoFecha(fecha)}`;
  if (d === 0) return 'El expediente vence hoy';
  return `El expediente vence el ${formatoFecha(fecha)} (${d} ${d === 1 ? 'día' : 'días'})`;
};
</script>

<template>
  <div class="space-y-4">
    <section class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6">
      <h1 class="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-100">Mis inspecciones ITSE</h1>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Locales que el jefe de ITSE le asignó y que esperan su visita.</p>

      <div v-if="!isLoading && !isError && conteo.total > 0" class="flex flex-wrap gap-2 text-xs mt-4">
        <span class="px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 font-semibold">
          {{ conteo.total }} {{ conteo.total === 1 ? 'pendiente' : 'pendientes' }}
        </span>
        <span v-if="conteo.hoy" class="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-[#0d6efd] dark:text-blue-300 font-semibold">
          {{ conteo.hoy }} para hoy
        </span>
        <span v-if="conteo.porCoordinar" class="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold">
          {{ conteo.porCoordinar }} por coordinar
        </span>
      </div>
    </section>

    <div
      v-if="isError"
      role="alert"
      class="p-4 text-center text-red-600 dark:text-red-400 font-semibold bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl"
    >
      No se pudo cargar su bandeja: {{ extractErrorMessage(error) }}
    </div>

    <div v-else-if="isLoading" class="space-y-3" role="status" aria-label="Cargando inspecciones">
      <Skeleton v-for="n in 3" :key="n" class="h-36 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="inspecciones.length === 0"
      class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-10 text-center text-sm text-neutral-500 dark:text-neutral-400"
    >
      No tiene inspecciones pendientes. Cuando el jefe de ITSE le asigne una, aparecerá aquí.
    </div>

    <ul v-else class="grid grid-cols-1 lg:grid-cols-2 gap-3">
      <li
        v-for="i in inspecciones"
        :key="i.id"
        class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 space-y-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Expediente N° {{ i.numero_expediente }} · {{ i.procedimiento }}
            </p>
            <h2 class="text-base font-bold text-neutral-900 dark:text-white mt-1 break-words">{{ i.nombre_comercial }}</h2>
            <p class="text-sm text-neutral-700 dark:text-neutral-300 break-words">{{ i.direccion }}</p>
          </div>
          <span :class="['shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full', visita(i).clase]">{{ visita(i).texto }}</span>
        </div>

        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <div>
            <dt class="text-neutral-500 dark:text-neutral-400">Solicitante</dt>
            <dd class="font-semibold text-neutral-800 dark:text-neutral-100">{{ i.solicitante }}</dd>
          </div>
          <div>
            <dt class="text-neutral-500 dark:text-neutral-400">Teléfono</dt>
            <dd class="font-semibold text-neutral-800 dark:text-neutral-100">
              <a v-if="i.solicitante_telefono" :href="`tel:${i.solicitante_telefono}`" class="text-[#0d6efd] dark:text-blue-400 hover:underline">
                {{ i.solicitante_telefono }}
              </a>
              <span v-else>No registrado</span>
            </dd>
          </div>
        </dl>

        <p v-if="i.indicaciones" class="text-xs text-neutral-700 dark:text-neutral-300 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900 rounded-xl p-3 whitespace-pre-line">
          <span class="font-semibold">Indicaciones:</span> {{ i.indicaciones }}
        </p>

        <div
          v-if="esReinspeccion(i)"
          class="text-xs rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-3 space-y-1"
        >
          <p class="font-semibold">
            Reinspección: acta N° {{ i.ultima_acta_numero }} observada
            <template v-if="i.fecha_limite_subsanacion"> · plazo para subsanar hasta el {{ formatoFecha(i.fecha_limite_subsanacion) }}</template>
          </p>
          <p class="whitespace-pre-line line-clamp-3">{{ i.ultima_acta_observaciones }}</p>
        </div>

        <div
          v-if="i.acta_anulada_numero"
          role="note"
          class="text-xs rounded-xl border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 p-3 space-y-1"
        >
          <p class="font-semibold">
            El jefe de ITSE anuló el acta N° {{ i.acta_anulada_numero }}: registre de nuevo
            {{ esReinspeccion(i) ? 'la reinspección' : 'la visita' }}.
          </p>
          <p class="whitespace-pre-line break-words">Motivo: {{ i.acta_anulada_motivo }}</p>
        </div>

        <p v-if="i.es_responsable === false" class="text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3">
          <span class="font-semibold">Usted acompaña esta inspección.</span>
          Responsable: {{ i.inspector_nombre }}, quien registra el acta.
          <template v-if="otrosAcompanantes(i).length"> También van: {{ otrosAcompanantes(i).join(', ') }}.</template>
        </p>
        <p v-else-if="i.acompanantes.length" class="text-xs text-neutral-700 dark:text-neutral-300">
          <span class="font-semibold">Lo acompañan:</span> {{ i.acompanantes.map((a) => a.nombre).join(', ') }}
        </p>

        <p class="text-[11px] text-neutral-500 dark:text-neutral-400">
          {{ plazo(i.fecha_vencimiento) }} · Asignado por {{ i.asignado_por }}
        </p>

        <div class="flex flex-col sm:flex-row gap-2 pt-1">
          <router-link
            v-if="i.es_responsable !== false"
            :to="`/inspector/acta/${i.id}`"
            class="flex-1 h-11 rounded-xl bg-[#0d6efd] hover:bg-blue-600 text-white text-sm font-semibold flex items-center justify-center"
          >
            {{ esReinspeccion(i) ? 'Registrar reinspección' : 'Registrar acta' }}
          </router-link>
          <button
            v-if="i.ultima_acta_id"
            type="button"
            class="h-11 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            @click="actaAbierta = i.ultima_acta_id"
          >
            Ver acta anterior
          </button>
        </div>
      </li>
    </ul>

    <ActaInspeccionDetalle :acta-id="actaAbierta" vista="inspector" @close="actaAbierta = null" />
  </div>
</template>
