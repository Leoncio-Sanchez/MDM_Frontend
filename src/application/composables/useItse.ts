import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { ItsePayload, InactivarItsePayload, FiltroPorRenovar } from '../../domain/entities/Itse.entity';
import type { Ref } from 'vue';

const KEY = ['itse'] as const;

/** Lista todos los ITSE */
export function useItseList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.itse.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** ITSE por vencer que aún no se renovaron; se vuelve a consultar al cambiar el filtro */
export function useItsePorRenovar(filtro: Ref<FiltroPorRenovar>) {
  return useQuery({
    queryKey: [...KEY, 'por-renovar', filtro],
    queryFn: () => container.itse.getPorRenovar(filtro.value),
    staleTime: 0,
  });
}

/** Obtiene un ITSE por ID */
export function useItse(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.itse.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un ITSE */
export function useCrearItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ItsePayload) => container.itse.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      // Emitir el ITSE saca al expediente de la lista de pendientes
      qc.invalidateQueries({ queryKey: ['expedientes', 'pendientes'] });
    },
  });
}

/** Actualiza un ITSE */
export function useActualizarItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ItsePayload }) => container.itse.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Inactiva un ITSE registrando el estado y su sustento */
export function useInactivarItse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InactivarItsePayload) => container.itse.inactivar(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
