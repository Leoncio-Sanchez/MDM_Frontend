/** Cifras generales del dashboard (solo totales; las ve todo el personal). */
export interface ResumenGeneral {
  expedientes: { en_tramite: number; por_vencer: number; vencidos: number };
  licencias: { vigentes: number; emitidas_mes: number; total: number };
  itse: { vigentes: number; por_vencer: number; emitidos_mes: number; dias_alerta: number };
}
