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
  /** Los expedientes no se eliminan (LPAG): se anulan y quedan como constancia */
  anulado?: boolean;
  anulacion?: AnulacionExpediente | null;
}

export interface AnulacionExpediente {
  motivo: string;
  /** Resolución u otro documento que la sustenta */
  documento: string | null;
  /** ISO con hora de Perú */
  fecha: string;
  usuario: number;
  usuario_nombre: string | null;
}

export interface AnularExpedientePayload {
  motivo: string;
  documento?: string | null;
}

/** LF = licencia de funcionamiento */
export type TipoDenegatoria = 'ITSE' | 'LF';

/** Respuesta final desfavorable: no se borra ni se repite */
export interface DenegatoriaPayload {
  /** YYYY-MM-DD, no futura */
  fecha_rechazo: string;
  /** Resolución que la sustenta */
  documento: string;
  observaciones: string;
}

export interface Denegatoria extends DenegatoriaPayload {
  id: number;
  tipo_autorizacion: TipoDenegatoria;
  fecha_digitacion: string;
  expediente: number;
  usuario: number;
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
