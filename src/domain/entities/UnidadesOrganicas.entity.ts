/**
 * Unidad orgánica (gerencia / subgerencia) de la municipalidad.
 * Refleja `/api/lf-itse/unidades-organicas/` (el backend solo expone el listado).
 */
export interface UnidadesOrganicas {
  id: number;
  codigo: string;
  nombre: string;
  sigla?: string | null;
  esta_activo: boolean;
}
