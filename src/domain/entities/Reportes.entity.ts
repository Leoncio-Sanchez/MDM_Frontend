/** Una licencia del padrón (informe mensual de licencias emitidas). */
export interface LicenciaPadron {
  numero_licencia: number;
  numero_expediente: number;
  nombre_comercial: string;
  titular: string;
  documento_titular: string;
  giros: string;
  zonificacion: string;
  nivel_riesgo: string;
  tipo_licencia: string;
  fecha_recepcion: string;
  fecha_emision: string;
  /** Días hábiles entre la recepción del expediente y la emisión */
  dias_habiles: number;
  /** Plazo TUPA propio del procedimiento */
  plazo_dias: number;
  dentro_de_plazo: boolean;
}

export interface PadronLicencias {
  desde: string;
  hasta: string;
  resumen: {
    total: number;
    por_nivel_riesgo: { nivel: string; total: number }[];
    /** null si no hay licencias en el periodo */
    tiempo_promedio_dias_habiles: number | null;
    dentro_de_plazo: number;
    porcentaje_cumplimiento: number | null;
  };
  licencias: LicenciaPadron[];
}

/** Reportes de auditoría (OCI): cada tipo exige su propio acceso */
export type TipoAuditoria = 'licencias' | 'itse';

/** Licencia o certificado ITSE pasado a un estado inactivo (anulada, revocada) */
export interface BajaRegistrada {
  fecha_estado: string;
  estado: string;
  /** Resolución que sustenta la baja */
  documento: string;
  motivo: string;
  /** N° de licencia o de certificado ITSE */
  numero: number;
  numero_expediente: number;
  nombre_comercial: string;
  titular: string;
  documento_titular: string;
  direccion: string;
  /** Emisión de la licencia o expedición del certificado */
  fecha_emision: string;
  registrado_por: string;
  /** Hora de Perú: "2026-09-15 15:30" */
  fecha_registro: string;
}

export interface ReporteBajas {
  desde: string;
  hasta: string;
  resumen: { total: number; por_estado: { estado: string; total: number }[] };
  registros: BajaRegistrada[];
}

/** Expediente de licencia o ITSE declarado improcedente */
export interface Improcedencia {
  fecha_rechazo: string;
  documento: string;
  motivo: string;
  numero_expediente: number;
  procedimiento: string;
  solicitante: string;
  documento_solicitante: string;
  fecha_recepcion: string;
  registrado_por: string;
  fecha_registro: string;
}

export interface ReporteImprocedentes {
  desde: string;
  hasta: string;
  resumen: { total: number };
  registros: Improcedencia[];
}

/** Informe formal en PDF (numerado: INFORME N° 001-2026-MDM/GDES). */
export interface InformePdf {
  contenido: Blob;
  nombreArchivo: string;
  codigo: string;
  /** El mes ya tenía informe: se reimprime con el mismo número */
  reimpresion: boolean;
}
