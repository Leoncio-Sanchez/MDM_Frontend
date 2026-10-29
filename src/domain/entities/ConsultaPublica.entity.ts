/** Qué puede consultar un ciudadano sin iniciar sesión. */
export type TipoTramite = 'expediente' | 'licencia' | 'itse';

export interface ConsultaPublicaParams {
  tipo: TipoTramite;
  numero: number;
  /** DNI, RUC o carné de extranjería del titular, solicitante o representante. */
  documento: string;
}

/**
 * En qué va la inspección ITSE del expediente (solo mientras la ITSE sigue pendiente).
 * fecha: visita programada (PROGRAMADA) o plazo para subsanar (OBSERVADA).
 */
export interface AvanceInspeccion {
  estado: 'POR_ASIGNAR' | 'POR_PROGRAMAR' | 'PROGRAMADA' | 'OBSERVADA' | 'APROBADA' | 'DESAPROBADA';
  fecha: string | null;
}

/**
 * Datos públicos de un trámite (sin DNI/RUC, nombres de personas ni direcciones).
 * En expedientes: fecha_emision = fecha de ingreso y fecha_vencimiento = fecha límite de atención.
 */
export interface TramitePublico {
  tipo: TipoTramite;
  numero: number;
  estado: 'EN TRÁMITE' | 'ATENDIDO' | 'IMPROCEDENTE' | 'ANULADO' | 'VIGENTE' | 'VENCIDO' | 'INACTIVO';
  nombre_comercial: string | null;
  procedimiento: string | null;
  giros: string[];
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  vigencia_indeterminada: boolean;
  /** Solo expedientes */
  inspeccion?: AvanceInspeccion | null;
}

/** "Mis trámites" del ciudadano con cuenta: todo lo que está a nombre de su documento */
export interface MisTramites {
  /** null si la cuenta no está vinculada a un documento */
  documento: string | null;
  expedientes: TramitePublico[];
  licencias: TramitePublico[];
  itse: TramitePublico[];
}

/** Crear la cuenta o restablecer la contraseña: el número de un expediente suyo prueba que el documento es suyo */
export interface DatosCuentaCiudadano {
  documento: string;
  numero_expediente: number;
  clave: string;
  clave_confirmation: string;
}

export const CLAVE_CIUDADANO_MINIMO = 8;
