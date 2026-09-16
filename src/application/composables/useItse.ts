import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Itse } from '../../domain/entities/Itse.entity';

const KEY = ['itse'] as const;

/** Lista todos los itse */
export function useItseList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.itse.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un itse por ID */
export function useItse(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.itse.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un itse */
export function useCrearItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Itse, 'id'>) => container.itse.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un itse */
export function useActualizarItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Itse> }) =>
      container.itse.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un itse */
export function useEliminarItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.itse.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
