import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Giros } from '../../domain/entities/Giros.entity';

const KEY = ['giros'] as const;

/** Lista todos los giros */
export function useGirosList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.giros.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un giros por ID */
export function useGiros(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.giros.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un giros */
export function useCrearGiros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Giros, 'id'>) => container.giros.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un giros */
export function useActualizarGiros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Giros> }) =>
      container.giros.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un giros */
export function useEliminarGiros() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.giros.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
