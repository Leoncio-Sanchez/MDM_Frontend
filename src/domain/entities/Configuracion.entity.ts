/** Datos institucionales que se imprimen en los informes formales (encabezado y firma). */
export interface ConfiguracionInforme {
  entidad: string;
  /** Nombre oficial del año (cambia cada enero); vacío = no se imprime */
  nombre_anio: string;
  gerencia: string;
  /** Va en el número del informe: 001-2026-{siglas} */
  siglas: string;
  firmante_nombre: string;
  firmante_cargo: string;
}
