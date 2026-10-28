import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { container } from '../../composition/container';
import type { ModuloArchivos } from '../../domain/entities/Archivo.entity';

const clave = (modulo: ModuloArchivos, registroId: Ref<number | null>) => ['archivos', modulo, registroId] as const;

/** Adjuntos de un expediente, licencia o ITSE (se consultan solo cuando hay un registro elegido). */
export function useArchivos(modulo: ModuloArchivos, registroId: Ref<number | null>) {
  return useQuery({
    queryKey: clave(modulo, registroId),
    queryFn: () => container.archivos.listar(modulo, registroId.value as number),
    enabled: computed(() => registroId.value !== null),
    staleTime: 0,
  });
}

export function useSubirArchivo(modulo: ModuloArchivos, registroId: Ref<number | null>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ archivo, onProgreso }: { archivo: File; onProgreso?: (p: number) => void }) =>
      container.archivos.subir(modulo, registroId.value as number, archivo, onProgreso),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave(modulo, registroId) }),
  });
}

export function useEliminarArchivo(modulo: ModuloArchivos, registroId: Ref<number | null>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (archivoId: number) => container.archivos.eliminar(modulo, archivoId),
    onSuccess: () => qc.invalidateQueries({ queryKey: clave(modulo, registroId) }),
  });
}
