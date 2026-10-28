import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { ConfiguracionInforme } from '../../domain/entities/Configuracion.entity';

const KEY = ['configuracion', 'informe'] as const;

/** Encabezado y firma de los informes formales */
export function useConfiguracionInforme() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.configuracion.informe(),
  });
}

export function useGuardarConfiguracionInforme() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (datos: ConfiguracionInforme) => container.configuracion.guardarInforme(datos),
    onSuccess: (guardada) => qc.setQueryData(KEY, guardada),
  });
}
