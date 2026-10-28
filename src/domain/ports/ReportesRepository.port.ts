import type { PadronLicencias } from '../entities/Reportes.entity';

export interface ReportesRepositoryPort {
  /** Sin fechas: el mes en curso */
  padronLicencias(desde?: string, hasta?: string): Promise<PadronLicencias>;
}
