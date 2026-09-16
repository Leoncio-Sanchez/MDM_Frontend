import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Inspectores } from '../../domain/entities/Inspectores.entity';

const KEY = ['inspectores'] as const;

/** Lista todos los inspectores */
export function useInspectoresList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.inspectores.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un inspectores por ID */
export function useInspectores(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.inspectores.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un inspectores */
export function useCrearInspectores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Inspectores, 'id'>) => container.inspectores.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un inspectores */
export function useActualizarInspectores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Inspectores> }) =>
      container.inspectores.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un inspectores */
export function useEliminarInspectores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.inspectores.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
