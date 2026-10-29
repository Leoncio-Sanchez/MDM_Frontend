import type {
  ActaInspeccion,
  AsignacionInspeccion,
  DatosLocalInspeccion,
  ExpedientePorInspeccionar,
  InspectorDisponible,
  NuevaActa,
  NuevaAsignacion,
  Reasignacion,
} from '../entities/Inspecciones.entity';

/** Quién consulta un acta: el inspector a cargo o la oficina (ITSE / jefe) */
export type VistaActa = 'inspector' | 'oficina';

export interface InspeccionesRepositoryPort {
  // Jefe de ITSE
  porInspeccionar(): Promise<ExpedientePorInspeccionar[]>;
  inspectores(): Promise<InspectorDisponible[]>;
  asignar(datos: NuevaAsignacion): Promise<AsignacionInspeccion>;
  actualizar(asignacionId: number, datos: DatosLocalInspeccion): Promise<AsignacionInspeccion>;
  reasignar(asignacionId: number, datos: Reasignacion): Promise<AsignacionInspeccion>;
  historial(expedienteId: number): Promise<AsignacionInspeccion[]>;
  actasDeExpediente(expedienteId: number): Promise<ActaInspeccion[]>;
  // Inspector
  miBandeja(): Promise<AsignacionInspeccion[]>;
  registrarActa(asignacionId: number, acta: NuevaActa, onProgreso?: (porcentaje: number) => void): Promise<ActaInspeccion>;
  // Ambos
  acta(actaId: number, vista: VistaActa): Promise<ActaInspeccion>;
  fotoActa(actaId: number, fotoId: number, vista: VistaActa): Promise<Blob>;
}
