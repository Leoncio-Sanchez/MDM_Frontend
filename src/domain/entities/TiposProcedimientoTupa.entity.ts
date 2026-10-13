/**
 * Procedimiento del TUPA (Texto Único de Procedimientos Administrativos).
 * Refleja `TipoProcedimientoTupaResource` (`/api/lf-itse/tipos-procedimiento-tupa/`).
 */
export interface TiposProcedimientoTupa {
  id: number;
  codigo: string;
  nombre: string;
  /** Días hábiles para atender el expediente */
  plazo_atencion_dias: number;
  /** Días antes del vencimiento en que se alerta (no mayor que el plazo) */
  dias_alerta_vencimiento: number;
  esta_activo: boolean;
  requiere_lf: boolean;
  requiere_itse: boolean;
  unidad_organica: number;
  fecha_digitacion?: string;
  usuario?: number;
}

export interface TipoProcedimientoTupaPayload {
  codigo: string;
  nombre: string;
  plazo_atencion_dias: number;
  dias_alerta_vencimiento: number;
  esta_activo: boolean;
  requiere_lf: boolean;
  requiere_itse: boolean;
  unidad_organica_id: number;
}
