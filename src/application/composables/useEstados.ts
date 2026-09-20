import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { ref, type Ref, computed } from 'vue';
import { container } from '../../composition/container';
import type { Estados } from '../../domain/entities/Estados.entity';

const KEY = ['estados'] as const;

export function useEstadosList(page: Ref<number> = ref(1)) {
  return useQuery({
    queryKey: [...KEY, page],
    queryFn: () => container.estados.getAll({ page: page.value }),
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
