/**
 * Licencia de Funcionamiento.
 * Refleja `LicenciaResource` del backend Laravel (`/api/lf-itse/licencias-funcionamiento/`).
 */

export interface LicenciaEstadoHistorial {
  id: number;
  licencia_funcionamiento: number;
  estado: number;
  fecha_estado: string;
  documento: string | null;
  observaciones: string | null;
  usuario: number | null;
  fecha_digitacion: string | null;
}

export interface LicenciasFuncionamiento {
  id: number;
  uuid?: string;
  numero_licencia: number;
  fecha_emision: string;
  nombre_comercial: string;
  expediente: number;
  tipo_licencia: number;
  titular: number;
  conductor: number;
  licencia_principal?: number | null;
  nivel_riesgo: number;
  zonificacion: number;
  actividad: string;
  direccion: string;
  /** Horario de atención en horas enteras (0-24) */
  hora_desde: number;
  hora_hasta: number;
  resolucion_numero: string;
  /** El backend lo devuelve como texto con 2 decimales, ej. "85.50" */
  area: string | number;
  numero_recibo_pago: string;
  es_vigencia_indeterminada: boolean;
  fecha_inicio_vigencia?: string | null;
  fecha_fin_vigencia?: string | null;
  observaciones?: string | null;
  se_puede_publicar?: boolean;
  fecha_notificacion?: string | null;
  giros?: unknown[];
  archivos?: unknown[];
  historial_estados?: LicenciaEstadoHistorial[];
}

/**
 * Datos de creación/edición. La edición (PUT) reemplaza la licencia completa:
 * se envían todos los campos, igual que al crear.
 */
export interface LicenciaPayload {
  numero_licencia?: number;
  nombre_comercial: string;
  tipo_licencia_id: number;
  titular_id: number;
  /** Si se omite, el backend usa al titular */
  conductor_id?: number | null;
  expediente_id: number;
  nivel_riesgo_id: number;
  zonificacion_id: number;
  actividad: string;
  direccion: string;
  hora_desde: number;
  hora_hasta: number;
  resolucion_numero: string;
  area: number;
  numero_recibo_pago: string;
  es_vigencia_indeterminada: boolean;
  fecha_inicio_vigencia?: string | null;
  fecha_fin_vigencia?: string | null;
  observaciones?: string | null;
  se_puede_publicar?: boolean;
}

export interface InactivarLicenciaPayload {
  licencia_id: number;
  estado_id: number;
  fecha_estado: string;
  documento: string;
  observaciones: string;
}
