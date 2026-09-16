import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { NivelesRiesgo } from '../../domain/entities/NivelesRiesgo.entity';

const KEY = ['nivelesRiesgo'] as const;

/** Lista todos los nivelesRiesgo */
export function useNivelesRiesgoList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.nivelesRiesgo.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un nivelesRiesgo por ID */
export function useNivelesRiesgo(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.nivelesRiesgo.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un nivelesRiesgo */
export function useCrearNivelesRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<NivelesRiesgo, 'id'>) => container.nivelesRiesgo.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un nivelesRiesgo */
export function useActualizarNivelesRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<NivelesRiesgo> }) =>
      container.nivelesRiesgo.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un nivelesRiesgo */
export function useEliminarNivelesRiesgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.nivelesRiesgo.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
