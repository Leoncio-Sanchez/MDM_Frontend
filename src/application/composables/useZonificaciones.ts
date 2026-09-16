import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Zonificaciones } from '../../domain/entities/Zonificaciones.entity';

const KEY = ['zonificaciones'] as const;

/** Lista todos los zonificaciones */
export function useZonificacionesList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.zonificaciones.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un zonificaciones por ID */
export function useZonificaciones(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.zonificaciones.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un zonificaciones */
export function useCrearZonificaciones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Zonificaciones, 'id'>) => container.zonificaciones.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un zonificaciones */
export function useActualizarZonificaciones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Zonificaciones> }) =>
      container.zonificaciones.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un zonificaciones */
export function useEliminarZonificaciones() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.zonificaciones.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
