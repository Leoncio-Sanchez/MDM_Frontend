export interface Itse {
  id: number;
  uuid?: string;
  numero_itse: string;
  tipo_itse_id?: number;
  fecha_expedicion?: string;
  fecha_caducidad?: string;
  nombre_comercial: string;
  direccion?: string;
  resolucion_numero?: string;
  area?: string | number;
  numero_recibo_pago?: string;
  observaciones?: string;
  se_puede_publicar?: boolean;
  capacidad_aforo?: number;
  expediente?: number;
  titular?: number;
  conductor?: number | null;
  nivel_riesgo?: number;
  giros?: any[];
  archivos?: any[];
  historial_estados?: any[];
}
