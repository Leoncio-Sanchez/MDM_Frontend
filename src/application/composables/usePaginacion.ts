import { computed, ref, watch, type MaybeRefOrGetter, toValue } from 'vue';

export const TAMANOS_PAGINA = [10, 25, 50, 100] as const;

/**
 * Paginación en el navegador para listas que ya llegan completas del servidor.
 * Si la lista cambia (se agrega, filtra o elimina) y la página actual queda fuera
 * de rango, vuelve a la última página válida.
 */
export function usePaginacion<T>(items: MaybeRefOrGetter<T[]>, tamanoInicial = 10) {
  const pagina = ref(1);
  const tamano = ref(tamanoInicial);

  const total = computed(() => toValue(items).length);
  const totalPaginas = computed(() => Math.max(1, Math.ceil(total.value / tamano.value)));

  const desde = computed(() => (total.value === 0 ? 0 : (pagina.value - 1) * tamano.value + 1));
  const hasta = computed(() => Math.min(pagina.value * tamano.value, total.value));

  const itemsPagina = computed(() => toValue(items).slice(desde.value - 1 < 0 ? 0 : desde.value - 1, hasta.value));

  const irA = (n: number) => {
    pagina.value = Math.min(Math.max(1, Math.trunc(n)), totalPaginas.value);
  };

  watch(totalPaginas, (max) => {
    if (pagina.value > max) pagina.value = max;
  });

  // Al cambiar cuántos se ven por página, volver al inicio para no "saltar" a otra parte de la lista
  watch(tamano, () => {
    pagina.value = 1;
  });

  return { pagina, tamano, total, totalPaginas, desde, hasta, itemsPagina, irA };
}
