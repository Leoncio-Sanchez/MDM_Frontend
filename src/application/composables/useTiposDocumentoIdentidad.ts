import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { TiposDocumentoIdentidad } from '../../domain/entities/TiposDocumentoIdentidad.entity';

const KEY = ['tiposDocumentoIdentidad'] as const;

/** Lista todos los tiposDocumentoIdentidad */
export function useTiposDocumentoIdentidadList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.tiposDocumentoIdentidad.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un tiposDocumentoIdentidad por ID */
export function useTiposDocumentoIdentidad(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.tiposDocumentoIdentidad.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un tiposDocumentoIdentidad */
export function useCrearTiposDocumentoIdentidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TiposDocumentoIdentidad, 'id'>) => container.tiposDocumentoIdentidad.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un tiposDocumentoIdentidad */
export function useActualizarTiposDocumentoIdentidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TiposDocumentoIdentidad> }) =>
      container.tiposDocumentoIdentidad.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un tiposDocumentoIdentidad */
export function useEliminarTiposDocumentoIdentidad() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.tiposDocumentoIdentidad.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
