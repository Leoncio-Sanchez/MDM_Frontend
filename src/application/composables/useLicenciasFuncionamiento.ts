import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { LicenciaPayload, InactivarLicenciaPayload } from '../../domain/entities/LicenciasFuncionamiento.entity';

const KEY = ['licenciasFuncionamiento'] as const;

/** Lista todas las licencias de funcionamiento */
export function useLicenciasFuncionamientoList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.licenciasFuncionamiento.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Emite una licencia */
export function useCrearLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LicenciaPayload) => container.licenciasFuncionamiento.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Emitir la licencia saca al expediente de la lista de pendientes
      qc.invalidateQueries({ queryKey: ['expedientes', 'pendientes'] });
    },
  });
}

/** Actualiza una licencia (reemplazo completo) */
export function useActualizarLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: LicenciaPayload }) =>
      container.licenciasFuncionamiento.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Inactiva una licencia registrando el estado y su sustento */
export function useInactivarLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InactivarLicenciaPayload) => container.licenciasFuncionamiento.inactivar(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
