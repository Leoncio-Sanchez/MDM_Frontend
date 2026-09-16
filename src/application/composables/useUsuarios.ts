import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { Usuarios } from '../../domain/entities/Usuarios.entity';

const KEY = ['usuarios'] as const;

/** Lista todos los usuarios */
export function useUsuariosList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.usuarios.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un usuarios por ID */
export function useUsuarios(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.usuarios.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un usuarios */
export function useCrearUsuarios() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Usuarios, 'id'>) => container.usuarios.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un usuarios */
export function useActualizarUsuarios() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Usuarios> }) =>
      container.usuarios.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un usuarios */
export function useEliminarUsuarios() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.usuarios.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
