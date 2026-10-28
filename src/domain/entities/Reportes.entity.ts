/** Una licencia del padrón (informe mensual de licencias emitidas). */
export interface LicenciaPadron {
  numero_licencia: number;
  numero_expediente: number;
  nombre_comercial: string;
  titular: string;
  documento_titular: string;
  giros: string;
  zonificacion: string;
  nivel_riesgo: string;
  tipo_licencia: string;
  fecha_recepcion: string;
  fecha_emision: string;
  /** Días hábiles entre la recepción del expediente y la emisión */
  dias_habiles: number;
  /** Plazo TUPA propio del procedimiento */
  plazo_dias: number;
  dentro_de_plazo: boolean;
}

export interface PadronLicencias {
  desde: string;
  hasta: string;
  resumen: {
    total: number;
    por_nivel_riesgo: { nivel: string; total: number }[];
    /** null si no hay licencias en el periodo */
    tiempo_promedio_dias_habiles: number | null;
    dentro_de_plazo: number;
    porcentaje_cumplimiento: number | null;
  };
  licencias: LicenciaPadron[];
}
