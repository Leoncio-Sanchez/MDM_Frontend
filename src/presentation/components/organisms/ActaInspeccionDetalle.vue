<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRef, watch } from 'vue';
import ModalShell from '../molecules/ModalShell.vue';
import Skeleton from '../atoms/Skeleton.vue';
import { useActa } from '../../../application/composables/useInspecciones';
import { container } from '../../../composition/container';
import { extractErrorMessage } from '../../../infrastructure/store/useNotificationStore';
import { formatoFecha } from '../../utils/fechas';
import { GRUPOS_CHECKLIST, type EstadoChecklist, type ResultadoActa, type TipoFotoActa } from '../../../domain/entities/Inspecciones.entity';
import type { VistaActa } from '../../../domain/ports/InspeccionesRepository.port';

/** Acta de inspección registrada (solo lectura): datos, checklist, resultado y fotos */
interface Props {
  /** null = cerrado */
  actaId: number | null;
  vista: VistaActa;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const { data: acta, isLoading, isError, error } = useActa(toRef(props, 'actaId'), props.vista);

// Las fotos requieren el token: se piden como blob y se muestran con una URL local
const urls = ref<Record<number, string>>({});
const fotosConError = ref<Set<number>>(new Set());

const liberar = () => {
  Object.values(urls.value).forEach((u) => URL.revokeObjectURL(u));
  urls.value = {};
  fotosConError.value = new Set();
};

watch(
  () => acta.value?.id,
  async () => {
    liberar();
    const a = acta.value;
    if (!a?.fotos) return;
    await Promise.all(
      a.fotos.map(async (f) => {
        try {
          const blob = await container.inspecciones.fotoActa(a.id, f.id, props.vista);
          urls.value = { ...urls.value, [f.id]: URL.createObjectURL(blob) };
        } catch {
          fotosConError.value = new Set([...fotosConError.value, f.id]);
        }
      }),
    );
  },
  { immediate: true },
);
onBeforeUnmount(liberar);

const NOMBRE_FOTO: Record<TipoFotoActa, string> = {
  FACHADA: 'Fachada',
  EXTINTORES: 'Extintores',
  TABLEROS: 'Tableros eléctricos',
  OTRA: 'Otra',
};
const ESTADO: Record<EstadoChecklist, { texto: string; clase: string }> = {
  CUMPLE: { texto: 'Cumple', clase: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' },
  NO_CUMPLE: { texto: 'No cumple', clase: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300' },
  NO_APLICA: { texto: 'No aplica', clase: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300' },
};
const RESULTADO: Record<ResultadoActa, { texto: string; clase: string }> = {
  APROBADO: { texto: 'Aprobado', clase: 'bg-emerald-600 text-white' },
  OBSERVADO: { texto: 'Observado', clase: 'bg-amber-500 text-white' },
  DESAPROBADO: { texto: 'Desaprobado', clase: 'bg-red-600 text-white' },
};

const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
const titulo = computed(() => (acta.value ? `Acta N° ${acta.value.numero_acta}` : 'Acta de inspección'));
</script>

<template>
  <ModalShell :open="actaId !== null" max-width="max-w-3xl" labelledby="acta-titulo">
    <div class="relative w-full bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
      <div class="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 id="acta-titulo" class="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">{{ titulo }}</h2>
          <p v-if="acta" class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Expediente N° {{ acta.numero_expediente }} · {{ acta.visita === 1 ? '1.ª visita' : 'Reinspección' }} · {{ acta.inspector_nombre }}
          </p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-5 sm:p-6 overflow-y-auto space-y-5">
        <div v-if="isLoading" class="space-y-3">
          <Skeleton class="h-10 w-full" />
          <Skeleton class="h-24 w-full" />
        </div>
        <p v-else-if="isError" role="alert" class="text-sm text-red-600 dark:text-red-400">No se pudo cargar el acta: {{ extractErrorMessage(error) }}</p>

        <template v-else-if="acta">
          <div class="flex flex-wrap items-center gap-3">
            <span :class="['px-3 py-1 rounded-full text-sm font-bold', RESULTADO[acta.resultado].clase]">{{ RESULTADO[acta.resultado].texto }}</span>
            <span v-if="acta.fecha_limite_subsanacion" class="text-xs text-amber-800 dark:text-amber-300">
              Plazo para subsanar hasta el {{ formatoFecha(acta.fecha_limite_subsanacion) }}; luego corresponde la reinspección.
            </span>
          </div>

          <dl class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Visita</dt>
              <dd class="font-semibold text-neutral-800 dark:text-neutral-100">{{ fechaHora(acta.fecha_visita) }}</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Metraje</dt>
              <dd class="font-semibold text-neutral-800 dark:text-neutral-100">{{ acta.area_m2.toLocaleString('es-PE') }} m²</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Aforo comprobado</dt>
              <dd class="font-semibold text-neutral-800 dark:text-neutral-100">{{ acta.aforo }} personas</dd>
            </div>
            <div>
              <dt class="text-neutral-500 dark:text-neutral-400">Registrada</dt>
              <dd class="font-semibold text-neutral-800 dark:text-neutral-100">{{ fechaHora(acta.fecha_registro) }}</dd>
            </div>
          </dl>

          <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <li v-for="g in GRUPOS_CHECKLIST" :key="g.clave" class="flex items-center justify-between gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2 text-sm">
              <span class="text-neutral-700 dark:text-neutral-200">{{ g.nombre }}</span>
              <span :class="['text-[11px] font-semibold px-2 py-0.5 rounded-full', ESTADO[acta[g.clave]].clase]">{{ ESTADO[acta[g.clave]].texto }}</span>
            </li>
          </ul>

          <div v-if="acta.observaciones">
            <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">Observaciones</h3>
            <p class="text-sm text-neutral-800 dark:text-neutral-100 whitespace-pre-line">{{ acta.observaciones }}</p>
          </div>

          <div>
            <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">Fotos de sustento</h3>
            <ul class="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <li v-for="f in acta.fotos ?? []" :key="f.id" class="space-y-1">
                <a
                  v-if="urls[f.id]"
                  :href="urls[f.id]"
                  target="_blank"
                  rel="noopener"
                  class="block aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800"
                  :title="`Abrir foto: ${NOMBRE_FOTO[f.tipo]}`"
                >
                  <img :src="urls[f.id]" :alt="`Foto: ${NOMBRE_FOTO[f.tipo]}`" class="w-full h-full object-cover" />
                </a>
                <div v-else-if="fotosConError.has(f.id)" class="aspect-[4/3] rounded-xl border border-red-200 dark:border-red-900 flex items-center justify-center text-[11px] text-red-600 dark:text-red-400 p-2 text-center">
                  No se pudo cargar
                </div>
                <Skeleton v-else class="aspect-[4/3] w-full rounded-xl" />
                <p class="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">{{ NOMBRE_FOTO[f.tipo] }}</p>
              </li>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </ModalShell>
</template>
