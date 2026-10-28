/** Datos de una persona según RENIEC (solo lo que usa el formulario; sin foto). */
export interface PersonaReniec {
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

/** Datos de un contribuyente según SUNAT. */
export interface ContribuyenteSunat {
  ruc: string;
  razon_social: string;
  /** Ej. "ACTIVO", "BAJA DE OFICIO" */
  estado: string;
  /** Ej. "HABIDO", "NO HABIDO" */
  condicion: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

/** Consultas a RENIEC y SUNAT a través de la PIDE (Plataforma de Interoperabilidad del Estado). */
export interface PideServicePort {
  consultarDni(dni: string): Promise<PersonaReniec>;
  consultarRuc(ruc: string): Promise<ContribuyenteSunat>;
}
