import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { TiposLicencia } from '../../domain/entities/TiposLicencia.entity';

const KEY = ['tiposLicencia'] as const;

/** Lista todos los tiposLicencia */
export function useTiposLicenciaList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.tiposLicencia.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un tiposLicencia por ID */
export function useTiposLicencia(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.tiposLicencia.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un tiposLicencia */
export function useCrearTiposLicencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TiposLicencia, 'id'>) => container.tiposLicencia.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un tiposLicencia */
export function useActualizarTiposLicencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TiposLicencia> }) =>
      container.tiposLicencia.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un tiposLicencia */
export function useEliminarTiposLicencia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.tiposLicencia.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
