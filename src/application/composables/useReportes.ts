import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { container } from '../../composition/container';
import type { TipoAuditoria } from '../../domain/entities/Reportes.entity';

/** Padrón de licencias emitidas entre dos fechas; solo se consulta si está habilitado (permiso). */
export function usePadronLicencias(rango: Ref<{ desde: string; hasta: string }>, habilitado: Ref<boolean>) {
  return useQuery({
    queryKey: ['reportes', 'padron-licencias', rango],
    queryFn: () => container.reportes.padronLicencias(rango.value.desde, rango.value.hasta),
    enabled: computed(() => habilitado.value),
    staleTime: 0,
  });
}

/** Bajas (anuladas/revocadas) del tipo elegido; sin tipo (sin acceso) no consulta. */
export function useReporteBajas(tipo: Ref<TipoAuditoria | null>, rango: Ref<{ desde: string; hasta: string }>) {
  return useQuery({
    queryKey: ['reportes', 'bajas', tipo, rango],
    queryFn: () => container.reportes.bajas(tipo.value!, rango.value.desde, rango.value.hasta),
    enabled: computed(() => tipo.value !== null),
    staleTime: 0,
  });
}

/** Expedientes improcedentes del tipo elegido; sin tipo (sin acceso) no consulta. */
export function useReporteImprocedentes(tipo: Ref<TipoAuditoria | null>, rango: Ref<{ desde: string; hasta: string }>) {
  return useQuery({
    queryKey: ['reportes', 'improcedentes', tipo, rango],
    queryFn: () => container.reportes.improcedentes(tipo.value!, rango.value.desde, rango.value.hasta),
    enabled: computed(() => tipo.value !== null),
    staleTime: 0,
  });
}
