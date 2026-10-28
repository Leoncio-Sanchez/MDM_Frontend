import type { InformePdf, PadronLicencias } from '../entities/Reportes.entity';

export interface ReportesRepositoryPort {
  /** Sin fechas: el mes en curso */
  padronLicencias(desde?: string, hasta?: string): Promise<PadronLicencias>;
  /** Solo un mes completo; la primera vez asigna el correlativo del informe */
  informeLicenciasPdf(desde: string, hasta: string): Promise<InformePdf>;
}
