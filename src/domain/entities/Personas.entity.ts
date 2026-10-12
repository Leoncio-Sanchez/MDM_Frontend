/**
 * Persona natural o jurídica (administrado, titular, conductor, solicitante).
 * Refleja `PersonaResource` del backend Laravel (`/api/lf-itse/personas/`).
 */

/** N = Natural, J = Jurídica */
export type TipoPersona = 'N' | 'J';

/** M = Masculino, F = Femenino, X = Prefiero no decirlo (se usa también para personas jurídicas) */
export type Sexo = 'M' | 'F' | 'X';

export interface PersonaDocumento {
  id?: number;
  numero_documento: string;
  persona?: number;
  /** ID del tipo de documento de identidad (DNI, RUC, CE…) */
  tipo_documento_identidad: number;
}

export interface Personas {
  id: number;
  tipo_persona: TipoPersona;
  sexo: Sexo;
  nombres: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  documentos: PersonaDocumento[];
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  user?: number;
}

/** Payload de creación/edición: los documentos se envían con `tipo_documento_identidad_id`. */
export interface PersonaPayload {
  tipo_persona: TipoPersona;
  sexo: Sexo;
  nombres: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  direccion?: string | null;
  distrito?: string | null;
  provincia?: string | null;
  departamento?: string | null;
  telefono?: string | null;
  correo_electronico?: string | null;
  documentos: { tipo_documento_identidad_id: number; numero_documento: string }[];
}

export interface OpcionCatalogo<T extends string = string> {
  value: T;
  label: string;
}
