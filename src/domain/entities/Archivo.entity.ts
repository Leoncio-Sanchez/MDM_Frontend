/** A qué tipo de trámite pertenece el adjunto (coincide con el prefijo de la ruta del backend). */
export type ModuloArchivos = 'expedientes' | 'itse' | 'licencias-funcionamiento';

/** Archivo adjunto (acta, foto de inspección, documento del trámite). */
export interface ArchivoAdjunto {
  id: number;
  uuid: string;
  nombre_original: string;
  extension: string;
  tamanio_bytes: number;
  fecha_digitacion: string;
  usuario: number;
}

/** Igual que la política del backend (PoliticaArchivos): se valida antes de subir. */
export const POLITICA_ARCHIVOS = {
  extensiones: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'],
  /** Se abren en el navegador; el resto se descarga */
  extensionesEnLinea: ['pdf', 'jpg', 'jpeg', 'png'],
  tamanioMaximoBytes: 10 * 1024 * 1024,
} as const;
