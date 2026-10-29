import { computed, type Ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { DatosLocalInspeccion, NuevaAsignacion, Reasignacion } from '../../domain/entities/Inspecciones.entity';

const KEY = ['inspecciones'] as const;

/** Expedientes que esperan inspección ITSE (jefe de ITSE) */
export function usePorInspeccionar() {
  return useQuery({
    queryKey: [...KEY, 'por-inspeccionar'],
    queryFn: () => container.inspecciones.porInspeccionar(),
  });
}

/** Inspectores activos con su carga pendiente (jefe de ITSE) */
export function useInspectoresDisponibles() {
  return useQuery({
    queryKey: [...KEY, 'inspectores'],
    queryFn: () => container.inspecciones.inspectores(),
  });
}

/** Asignaciones de un expediente, vigente y anteriores */
export function useHistorialAsignaciones(expedienteId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => [...KEY, 'historial', expedienteId.value]),
    queryFn: () => container.inspecciones.historial(expedienteId.value!),
    enabled: computed(() => expedienteId.value !== null),
  });
}

/** Inspecciones pendientes del inspector que inició sesión */
export function useMiBandeja() {
  return useQuery({
    queryKey: [...KEY, 'mi-bandeja'],
    queryFn: () => container.inspecciones.miBandeja(),
  });
}

// Cualquier cambio altera la lista, la carga de los inspectores y el historial
function useInvalidar() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useAsignarInspector() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: (datos: NuevaAsignacion) => container.inspecciones.asignar(datos),
    onSuccess: invalidar,
  });
}

export function useActualizarAsignacion() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: DatosLocalInspeccion }) => container.inspecciones.actualizar(id, datos),
    onSuccess: invalidar,
  });
}

export function useReasignarInspector() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, datos }: { id: number; datos: Reasignacion }) => container.inspecciones.reasignar(id, datos),
    onSuccess: invalidar,
  });
}
