/**
 * Certificado ITSE (Inspección Técnica de Seguridad en Edificaciones).
 * Refleja `ItseResource` del backend Laravel (`/api/lf-itse/itse/`).
 */

/** 1 = Estándar, 2 = Renovación */
export type TipoItse = 1 | 2;

export interface ItseEstadoHistorial {
  id: number;
  fecha_estado: string;
  documento: string;
  observaciones: string;
  fecha_digitacion: string;
  itse: number;
  estado: number;
  usuario: number;
}

export interface Itse {
  id: number;
  uuid?: string;
  tipo_itse_id: TipoItse;
  numero_itse: number;
  fecha_expedicion: string;
  fecha_solicitud_renovacion?: string | null;
  fecha_caducidad: string;
  fecha_notificacion?: string | null;
  fecha_digitacion?: string;
  nombre_comercial: string;
  direccion: string;
  resolucion_numero: string;
  /** El backend lo devuelve como texto con 2 decimales, ej. "85.50" */
  area: string | number;
  capacidad_aforo?: number | null;
  numero_recibo_pago: string;
  observaciones?: string | null;
  se_puede_publicar?: boolean;
  expediente: number;
  titular: number;
  conductor: number;
  itse_principal?: number | null;
  nivel_riesgo: number;
  usuario?: number;
  giros?: unknown[];
  archivos?: unknown[];
  historial_estados?: ItseEstadoHistorial[];
}

/** Payload de creación. En edición el backend no acepta cambiar `expediente_id` ni `itse_principal_id`. */
export interface ItsePayload {
  tipo_itse_id: TipoItse;
  numero_itse: number;
  fecha_expedicion: string;
  fecha_solicitud_renovacion?: string | null;
  fecha_caducidad: string;
  nombre_comercial: string;
  direccion: string;
  resolucion_numero: string;
  area: number;
  capacidad_aforo?: number;
  numero_recibo_pago: string;
  observaciones?: string | null;
  se_puede_publicar?: boolean;
  expediente_id?: number;
  itse_principal_id?: number | null;
  nivel_riesgo_id: number;
  conductor_id: number;
  titular_id: number;
}

export interface InactivarItsePayload {
  itse_id: number;
  estado_id: number;
  fecha_estado: string;
  documento: string;
  observaciones: string;
}
