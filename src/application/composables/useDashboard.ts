import { useQuery } from '@tanstack/vue-query';
import { container } from '../../composition/container';

/** Cifras generales del dashboard. Se refrescan al volver a la pantalla (cambian al registrar trámites). */
export function useResumenGeneral() {
  return useQuery({
    queryKey: ['dashboard', 'resumen'],
    queryFn: () => container.dashboard.getResumen(),
    staleTime: 0,
  });
}
