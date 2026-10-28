import type { InformePdf, PadronLicencias, ReporteBajas, ReporteImprocedentes, TipoAuditoria } from '../entities/Reportes.entity';

export interface ReportesRepositoryPort {
  /** Sin fechas: el mes en curso */
  padronLicencias(desde?: string, hasta?: string): Promise<PadronLicencias>;
  /** Solo un mes completo; la primera vez asigna el correlativo del informe */
  informeLicenciasPdf(desde: string, hasta: string): Promise<InformePdf>;
  /** Licencias o certificados ITSE anulados/revocados en el periodo */
  bajas(tipo: TipoAuditoria, desde: string, hasta: string): Promise<ReporteBajas>;
  /** Expedientes de licencia o ITSE declarados improcedentes en el periodo */
  improcedentes(tipo: TipoAuditoria, desde: string, hasta: string): Promise<ReporteImprocedentes>;
}
