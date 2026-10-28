import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { container } from '../../composition/container';

/** Padrón de licencias emitidas entre dos fechas; solo se consulta si está habilitado (permiso). */
export function usePadronLicencias(rango: Ref<{ desde: string; hasta: string }>, habilitado: Ref<boolean>) {
  return useQuery({
    queryKey: ['reportes', 'padron-licencias', rango],
    queryFn: () => container.reportes.padronLicencias(rango.value.desde, rango.value.hasta),
    enabled: computed(() => habilitado.value),
    staleTime: 0,
  });
}
