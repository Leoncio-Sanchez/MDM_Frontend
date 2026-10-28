import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { type Ref, computed } from 'vue';
import { container } from '../../composition/container';
import type { Estados } from '../../domain/entities/Estados.entity';

const KEY = ['estados'] as const;

export function useEstadosList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.estados.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEstado(id: Ref<number | null>) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.estados.getById(id.value!),
    enabled: computed(() => id.value !== null && Number.isFinite(id.value)),
  });
}

export function useCrearEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Estados, 'id'>) => container.estados.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useActualizarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Estados> }) =>
      container.estados.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEliminarEstado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.estados.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Estados inactivos para ITSE (motivos de inactivación de un certificado) */
export function useEstadosInactivosItse() {
  return useQuery({
    queryKey: [...KEY, 'inactivos-itse'],
    queryFn: () => container.estados.getInactivosItse(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Estados inactivos para Licencias de Funcionamiento (motivos de inactivación) */
export function useEstadosInactivosLf() {
  return useQuery({
    queryKey: [...KEY, 'inactivos-lf'],
    queryFn: () => container.estados.getInactivosLf(),
    staleTime: 1000 * 60 * 5,
  });
}
