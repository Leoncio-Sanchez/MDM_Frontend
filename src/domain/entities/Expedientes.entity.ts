export interface Expedientes {
  id: number;
  uuid?: string;
  numero_expediente?: number;
  fecha_recepcion: string;
  fecha_vencimiento?: string;
  fecha_alerta?: string;
  tipo_procedimiento_tupa_id?: number;
  tipo_procedimiento_tupa?: number;
  solicitante_id?: number;
  solicitante?: number;
  representante_id?: number | null;
  observaciones?: string | null;
}
