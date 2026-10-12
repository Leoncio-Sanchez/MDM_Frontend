import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Expedientes } from '../../domain/entities/Expedientes.entity';

const KEY = ['expedientes'] as const;

/** Lista todos los expedientes */
export function useExpedientesList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.expedientes.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un expedientes por ID */
export function useExpedientes(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.expedientes.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un expedientes */
export function useCrearExpedientes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Expedientes, 'id'>) => container.expedientes.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un expedientes */
export function useActualizarExpedientes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Expedientes> }) =>
      container.expedientes.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un expedientes */
export function useEliminarExpedientes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.expedientes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Expedientes en trámite: con licencia y/o ITSE aún no emitidos */
export function useExpedientesPendientes() {
  return useQuery({
    queryKey: [...KEY, 'pendientes'],
    queryFn: () => container.expedientes.getPendientes(),
    // Sin caché: cambia al emitir licencias o ITSE desde otras pantallas
    staleTime: 0,
  });
}
