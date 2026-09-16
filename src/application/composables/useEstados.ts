import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Estados } from '../../domain/entities/Estados.entity';

const KEY = ['estados'] as const;

/** Lista todos los estados */
export function useEstadosList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.estados.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un estados por ID */
export function useEstados(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.estados.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un estados */
export function useCrearEstados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Estados, 'id'>) => container.estados.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un estados */
export function useActualizarEstados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Estados> }) =>
      container.estados.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un estados */
export function useEliminarEstados() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.estados.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
