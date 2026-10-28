<script setup lang="ts">
import { computed } from 'vue';
import { TAMANOS_PAGINA } from '../../../application/composables/usePaginacion';

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  desde: number;
  hasta: number;
  tamano: number;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:pagina': [valor: number];
  'update:tamano': [valor: number];
}>();

/** Primera, última, la actual y sus vecinas; "…" donde se saltan páginas. Ej.: 1 … 4 5 6 … 42 */
const botones = computed<(number | '…')[]>(() => {
  const { pagina, totalPaginas } = props;
  const visibles = new Set([1, totalPaginas, pagina - 1, pagina, pagina + 1].filter((n) => n >= 1 && n <= totalPaginas));
  const ordenadas = [...visibles].sort((a, b) => a - b);

  const resultado: (number | '…')[] = [];
  ordenadas.forEach((n, i) => {
    if (i > 0 && n - ordenadas[i - 1] > 1) resultado.push('…');
    resultado.push(n);
  });
  return resultado;
});

const ir = (n: number) => emit('update:pagina', Math.min(Math.max(1, n), props.totalPaginas));

const claseBoton =
  'min-w-8 h-8 px-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed';
const claseNormal =
  'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800';
const claseActual = 'border-[#0d6efd] bg-[#0d6efd] text-white';
</script>

<template>
  <nav
    v-if="total > 0"
    aria-label="Paginación"
    class="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-600 dark:text-neutral-400"
  >
    <div class="flex items-center gap-3">
      <span aria-live="polite">Mostrando <strong class="text-neutral-800 dark:text-neutral-200">{{ desde }}–{{ hasta }}</strong> de <strong class="text-neutral-800 dark:text-neutral-200">{{ total }}</strong></span>
      <label class="flex items-center gap-1.5">
        <span class="sr-only sm:not-sr-only">Por página</span>
        <select
          :value="tamano"
          class="h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-neutral-700 dark:text-neutral-200 px-2 cursor-pointer"
          @change="emit('update:tamano', Number(($event.target as HTMLSelectElement).value))"
        >
          <option v-for="t in TAMANOS_PAGINA" :key="t" :value="t">{{ t }}</option>
        </select>
      </label>
    </div>

    <div v-if="totalPaginas > 1" class="flex items-center gap-1">
      <button type="button" :class="[claseBoton, claseNormal]" :disabled="pagina === 1" aria-label="Página anterior" @click="ir(pagina - 1)">‹</button>
      <template v-for="(b, i) in botones" :key="`${b}-${i}`">
        <span v-if="b === '…'" class="px-1 text-neutral-400" aria-hidden="true">…</span>
        <button
          v-else
          type="button"
          :class="[claseBoton, b === pagina ? claseActual : claseNormal]"
          :aria-current="b === pagina ? 'page' : undefined"
          :aria-label="`Página ${b}`"
          @click="ir(b)"
        >
          {{ b }}
        </button>
      </template>
      <button type="button" :class="[claseBoton, claseNormal]" :disabled="pagina === totalPaginas" aria-label="Página siguiente" @click="ir(pagina + 1)">›</button>
    </div>
  </nav>
</template>
