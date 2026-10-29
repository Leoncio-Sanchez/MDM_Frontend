export type EstadoChecklist = 'CUMPLE' | 'NO_CUMPLE' | 'NO_APLICA';
export type ResultadoActa = 'APROBADO' | 'OBSERVADO' | 'DESAPROBADO';
export type TipoFotoActa = 'FACHADA' | 'EXTINTORES' | 'TABLEROS' | 'OTRA';
export type GrupoChecklist = 'extintores' | 'senalizacion' | 'luces_emergencia' | 'tableros_electricos';

/** Los 4 grupos que verifica el inspector (D.S. N° 002-2018-PCM) */
export const GRUPOS_CHECKLIST: { clave: GrupoChecklist; nombre: string }[] = [
  { clave: 'extintores', nombre: 'Extintores' },
  { clave: 'senalizacion', nombre: 'Señalización' },
  { clave: 'luces_emergencia', nombre: 'Luces de emergencia' },
  { clave: 'tableros_electricos', nombre: 'Tableros eléctricos' },
];

export const PLAZOS_SUBSANACION = [2, 3] as const;

/** Estado de la última acta del expediente (vacío si aún no hay visita) */
export interface UltimaActa {
  ultima_acta_id: number | null;
  ultima_acta_numero: string | null;
  ultima_acta_visita: number | null;
  ultima_acta_resultado: ResultadoActa | null;
  fecha_limite_subsanacion: string | null;
  ultima_acta_observaciones: string | null;
  /** El jefe anuló el acta de la visita que sigue: hay que volver a registrarla */
  acta_anulada_numero: string | null;
  acta_anulada_motivo: string | null;
  acta_anulada_fecha: string | null;
}

export const MOTIVO_ANULACION_MINIMO = 10;
export const MOTIVO_ANULACION_MAXIMO = 500;

export interface AnulacionActa {
  motivo: string;
  documento?: string | null;
}

/** Inspector que acompaña al responsable; el acta la registra solo el responsable */
export interface AcompananteInspeccion {
  id: number;
  nombre: string;
  /** No viene en el acta (allí se guarda quién fue, aunque luego lo desactiven) */
  activo?: boolean;
}

export const MAXIMO_ACOMPANANTES = 3;

export interface FotoActa {
  id: number;
  tipo: TipoFotoActa;
  nombre_original: string;
  extension: string;
  tamanio_bytes: number;
}

export interface ActaInspeccion extends Record<GrupoChecklist, EstadoChecklist> {
  id: number;
  expediente_id: number;
  numero_expediente: number;
  asignacion_id: number;
  inspector_id: number;
  inspector_nombre: string;
  /** Quiénes acompañaron la visita */
  acompanantes: AcompananteInspeccion[];
  numero_acta: string;
  visita: 1 | 2;
  fecha_visita: string;
  area_m2: number;
  aforo: number;
  observaciones: string | null;
  resultado: ResultadoActa;
  fecha_limite_subsanacion: string | null;
  fecha_registro: string;
  /** Anulada por el jefe de ITSE: se conserva como constancia, pero ya no cuenta */
  anulada: boolean;
  fecha_anulacion: string | null;
  motivo_anulacion: string | null;
  documento_anulacion: string | null;
  anulado_por: string | null;
  /** Solo al pedir un acta en particular */
  fotos?: FotoActa[];
}

export interface NuevaActa extends Record<GrupoChecklist, EstadoChecklist> {
  numero_acta: string;
  /** ISO con zona horaria */
  fecha_visita: string;
  area_m2: number;
  aforo: number;
  observaciones: string | null;
  plazo_subsanacion_dias: number | null;
  fotos: { tipo: TipoFotoActa; archivo: File }[];
}

/** Expediente que espera su inspección ITSE, con su asignación vigente si la tiene */
export interface ExpedientePorInspeccionar extends UltimaActa {
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
  acompanantes: AcompananteInspeccion[];
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
  /** Inspecciones pendientes en las que va como acompañante */
  acompanando: number;
}

export interface AsignacionInspeccion extends UltimaActa {
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
  acompanantes: AcompananteInspeccion[];
  /** Solo en la bandeja: false si el inspector va como acompañante */
  es_responsable?: boolean;
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
  /** Ids de los acompañantes (el responsable no va aquí) */
  acompanantes: number[];
}

export interface NuevaAsignacion extends DatosLocalInspeccion {
  expediente_id: number;
  inspector_id: number;
}

export interface Reasignacion {
  inspector_id: number;
  acompanantes: number[];
  motivo: string;
  fecha_programada: string | null;
  indicaciones: string | null;
}
