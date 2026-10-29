import { computed, type Ref } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { AnulacionActa, DatosLocalInspeccion, NuevaActa, NuevaAsignacion, Reasignacion } from '../../domain/entities/Inspecciones.entity';
import type { VistaActa } from '../../domain/ports/InspeccionesRepository.port';

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

/** Actas del expediente (oficina) */
export function useActasDeExpediente(expedienteId: Ref<number | null>) {
  return useQuery({
    queryKey: computed(() => [...KEY, 'actas-expediente', expedienteId.value]),
    queryFn: () => container.inspecciones.actasDeExpediente(expedienteId.value!),
    enabled: computed(() => expedienteId.value !== null),
  });
}

/** Un acta con la lista de sus fotos */
export function useActa(actaId: Ref<number | null>, vista: VistaActa) {
  return useQuery({
    queryKey: computed(() => [...KEY, 'acta', vista, actaId.value]),
    queryFn: () => container.inspecciones.acta(actaId.value!, vista),
    enabled: computed(() => actaId.value !== null),
    // El acta no cambia una vez registrada (al anularla se invalida)
    staleTime: Infinity,
  });
}

/** El jefe de ITSE anula un acta registrada con un error */
export function useAnularActa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ actaId, datos }: { actaId: number; datos: AnulacionActa }) => container.inspecciones.anularActa(actaId, datos),
    onSuccess: invalidar,
  });
}

/** El inspector registra el acta de su visita */
export function useRegistrarActa() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ asignacionId, acta, onProgreso }: { asignacionId: number; acta: NuevaActa; onProgreso?: (p: number) => void }) =>
      container.inspecciones.registrarActa(asignacionId, acta, onProgreso),
    onSuccess: invalidar,
  });
}
