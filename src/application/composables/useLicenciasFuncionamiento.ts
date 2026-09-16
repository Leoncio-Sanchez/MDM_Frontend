import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { LicenciasFuncionamiento } from '../../domain/entities/LicenciasFuncionamiento.entity';

const KEY = ['licenciasFuncionamiento'] as const;

/** Lista todos los licenciasFuncionamiento */
export function useLicenciasFuncionamientoList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.licenciasFuncionamiento.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un licenciasFuncionamiento por ID */
export function useLicenciasFuncionamiento(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.licenciasFuncionamiento.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un licenciasFuncionamiento */
export function useCrearLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LicenciasFuncionamiento, 'id'>) => container.licenciasFuncionamiento.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un licenciasFuncionamiento */
export function useActualizarLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LicenciasFuncionamiento> }) =>
      container.licenciasFuncionamiento.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un licenciasFuncionamiento */
export function useEliminarLicenciasFuncionamiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.licenciasFuncionamiento.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
