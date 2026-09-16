import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { TiposProcedimientoTupa } from '../../domain/entities/TiposProcedimientoTupa.entity';

const KEY = ['tiposProcedimientoTupa'] as const;

/** Lista todos los tiposProcedimientoTupa */
export function useTiposProcedimientoTupaList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.tiposProcedimientoTupa.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un tiposProcedimientoTupa por ID */
export function useTiposProcedimientoTupa(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.tiposProcedimientoTupa.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un tiposProcedimientoTupa */
export function useCrearTiposProcedimientoTupa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TiposProcedimientoTupa, 'id'>) => container.tiposProcedimientoTupa.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un tiposProcedimientoTupa */
export function useActualizarTiposProcedimientoTupa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<TiposProcedimientoTupa> }) =>
      container.tiposProcedimientoTupa.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un tiposProcedimientoTupa */
export function useEliminarTiposProcedimientoTupa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.tiposProcedimientoTupa.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
