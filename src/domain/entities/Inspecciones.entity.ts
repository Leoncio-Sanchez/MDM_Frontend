/** Expediente que espera su inspección ITSE, con su asignación vigente si la tiene */
export interface ExpedientePorInspeccionar {
  expediente_id: number;
  numero_expediente: number;
  fecha_recepcion: string;
  fecha_vencimiento: string;
  mostrar_alerta: boolean;
  procedimiento: string;
  solicitante: string;
  /** Local propuesto: de la licencia del expediente o, si no hay, del solicitante */
  sugerido_nombre_comercial: string;
  sugerido_direccion: string;
  asignacion_id: number | null;
  inspector_id: number | null;
  inspector_nombre: string | null;
  inspector_activo: boolean | null;
  nombre_comercial: string | null;
  direccion: string | null;
  fecha_programada: string | null;
  indicaciones: string | null;
  fecha_asignacion: string | null;
}

export interface InspectorDisponible {
  id: number;
  username: string;
  nombre: string;
  /** Inspecciones asignadas que aún no se realizan */
  pendientes: number;
}

export interface AsignacionInspeccion {
  id: number;
  expediente_id: number;
  numero_expediente: number;
  fecha_recepcion: string;
  fecha_vencimiento: string;
  procedimiento: string;
  solicitante: string;
  solicitante_telefono: string | null;
  inspector_id: number;
  inspector_nombre: string;
  nombre_comercial: string;
  direccion: string;
  fecha_programada: string | null;
  indicaciones: string | null;
  fecha_asignacion: string;
  asignado_por: string;
  vigente: boolean;
  fecha_reasignacion: string | null;
  reasignado_por: string | null;
  motivo_reasignacion: string | null;
}

export interface DatosLocalInspeccion {
  nombre_comercial: string;
  direccion: string;
  fecha_programada: string | null;
  indicaciones: string | null;
}

export interface NuevaAsignacion extends DatosLocalInspeccion {
  expediente_id: number;
  inspector_id: number;
}

export interface Reasignacion {
  inspector_id: number;
  motivo: string;
  fecha_programada: string | null;
  indicaciones: string | null;
}
