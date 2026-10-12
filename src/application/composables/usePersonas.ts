import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { PersonaPayload } from '../../domain/entities/Personas.entity';

const KEY = ['personas'] as const;

/** Lista todos los personas */
export function usePersonasList() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.personas.getAll(),
    staleTime: 1000 * 60 * 5,
  });
}

/** Obtiene un personas por ID */
export function usePersonas(id: number | null) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => container.personas.getById(id!),
    enabled: id !== null && Number.isFinite(id),
  });
}

/** Crea un personas */
export function useCrearPersonas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PersonaPayload) => container.personas.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Actualiza un personas */
export function useActualizarPersonas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PersonaPayload> }) =>
      container.personas.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Elimina un personas */
export function useEliminarPersonas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => container.personas.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

/** Catálogo de sexos (M / F / X) */
export function usePersonasSexos() {
  return useQuery({
    queryKey: [...KEY, 'sexos'],
    queryFn: () => container.personas.getSexos(),
    staleTime: Infinity,
  });
}
