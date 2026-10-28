/** Qué puede consultar un ciudadano sin iniciar sesión. */
export type TipoTramite = 'expediente' | 'licencia' | 'itse';

export interface ConsultaPublicaParams {
  tipo: TipoTramite;
  numero: number;
  /** DNI, RUC o carné de extranjería del titular, solicitante o representante. */
  documento: string;
}

/**
 * Datos públicos de un trámite (sin DNI/RUC, nombres de personas ni direcciones).
 * En expedientes: fecha_emision = fecha de ingreso y fecha_vencimiento = fecha límite de atención.
 */
export interface TramitePublico {
  tipo: TipoTramite;
  numero: number;
  estado: 'EN TRÁMITE' | 'ATENDIDO' | 'IMPROCEDENTE' | 'VIGENTE' | 'VENCIDO' | 'INACTIVO';
  nombre_comercial: string | null;
  procedimiento: string | null;
  giros: string[];
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  vigencia_indeterminada: boolean;
}
