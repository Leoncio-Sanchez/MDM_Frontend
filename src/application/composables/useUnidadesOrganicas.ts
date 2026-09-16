import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { UnidadesOrganicas } from '../../domain/entities/UnidadesOrganicas.entity';

const KEY = ['unidadesOrganicas'] as const;

/** Lista todos los unidadesOrganicas */
export function useUnidadesOrganicasList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.unidadesOrganicas.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un unidadesOrganicas por ID */
export function useUnidadesOrganicas(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.unidadesOrganicas.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un unidadesOrganicas */
export function useCrearUnidadesOrganicas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<UnidadesOrganicas, 'id'>) => container.unidadesOrganicas.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un unidadesOrganicas */
export function useActualizarUnidadesOrganicas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UnidadesOrganicas> }) =>
      container.unidadesOrganicas.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un unidadesOrganicas */
export function useEliminarUnidadesOrganicas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.unidadesOrganicas.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
