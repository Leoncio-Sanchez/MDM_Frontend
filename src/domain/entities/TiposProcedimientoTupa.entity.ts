export interface TiposProcedimientoTupa {
  id: number;
  codigo: string;
  nombre: string;
  plazo_atencion_dias: number;
  dias_alerta_vencimiento: number;
  esta_activo: boolean;
  requiere_lf: boolean;
  requiere_itse: boolean;
  unidad_organica?: number;
}
