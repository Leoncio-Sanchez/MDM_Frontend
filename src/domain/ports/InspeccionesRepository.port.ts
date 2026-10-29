import type {
  AsignacionInspeccion,
  DatosLocalInspeccion,
  ExpedientePorInspeccionar,
  InspectorDisponible,
  NuevaAsignacion,
  Reasignacion,
} from '../entities/Inspecciones.entity';

export interface InspeccionesRepositoryPort {
  // Jefe de ITSE
  porInspeccionar(): Promise<ExpedientePorInspeccionar[]>;
  inspectores(): Promise<InspectorDisponible[]>;
  asignar(datos: NuevaAsignacion): Promise<AsignacionInspeccion>;
  actualizar(asignacionId: number, datos: DatosLocalInspeccion): Promise<AsignacionInspeccion>;
  reasignar(asignacionId: number, datos: Reasignacion): Promise<AsignacionInspeccion>;
  historial(expedienteId: number): Promise<AsignacionInspeccion[]>;
  // Inspector
  miBandeja(): Promise<AsignacionInspeccion[]>;
}
