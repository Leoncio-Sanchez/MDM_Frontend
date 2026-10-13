/**
 * Unidad orgánica (gerencia / subgerencia) de la municipalidad.
 * Refleja `UnidadOrganicaResource` (`/api/lf-itse/unidades-organicas/`). La sigla llega como '' si no tiene.
 */
export interface UnidadesOrganicas {
  id: number;
  codigo: string;
  nombre: string;
  sigla?: string | null;
  esta_activo: boolean;
}

/** Crear o reemplazar (PUT) una unidad: se envían todos los campos. */
export interface UnidadOrganicaPayload {
  codigo: string;
  nombre: string;
  sigla: string | null;
  esta_activo: boolean;
}
