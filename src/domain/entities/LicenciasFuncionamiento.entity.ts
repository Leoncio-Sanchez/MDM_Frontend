export interface LicenciasFuncionamiento {
  id: number;
  uuid?: string;
  numero_licencia: string;
  fecha_emision?: string | null;
  expediente?: number;
  tipo_licencia?: number;
  nombre_comercial: string;
  titular?: number;
  conductor?: number | null;
  nivel_riesgo?: number;
  zonificacion?: number;
  actividad?: string;
  direccion?: string;
  area?: string | number;
  es_vigencia_indeterminada?: boolean;
  fecha_inicio_vigencia?: string | null;
  fecha_fin_vigencia?: string | null;
  resolucion_numero?: string;
  numero_recibo_pago?: string;
  observaciones?: string;
  se_puede_publicar?: boolean;
  giros?: any[];
  archivos?: any[];
  historial_estados?: any[];
}
