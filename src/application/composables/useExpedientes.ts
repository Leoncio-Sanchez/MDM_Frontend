import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { AnularExpedientePayload, Expedientes } from '../../domain/entities/Expedientes.entity';

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

/** Anula un expediente (no se elimina): sale de pendientes y del resumen del dashboard */
export function useAnularExpediente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: AnularExpedientePayload }) => container.expedientes.anular(id, datos),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
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
