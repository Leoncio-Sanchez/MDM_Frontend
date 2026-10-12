export interface Expedientes {
  id: number;
  uuid?: string;
  numero_expediente?: number;
  fecha_recepcion: string;
  fecha_vencimiento?: string;
  fecha_alerta?: string;
  tipo_procedimiento_tupa_id?: number;
  tipo_procedimiento_tupa?: number;
  solicitante_id?: number;
  solicitante?: number;
  representante_id?: number | null;
  observaciones?: string | null;
}

/** Expediente cuya licencia y/o ITSE aún no se emite (`/expedientes/pendientes/`). */
export interface ExpedientePendiente {
  id: number;
  numero_expediente: number;
  fecha_recepcion: string;
  /** Nombre del procedimiento TUPA */
  nombre: string;
  fecha_vencimiento: string;
  fecha_alerta: string;
  persona_nombre: string;
  licencia_pendiente: boolean;
  itse_pendiente: boolean;
  /** true cuando ya pasó la fecha de alerta (vence pronto) */
  mostrar_alerta: boolean;
  dias_habiles_restantes: number;
}
