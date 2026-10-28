import type { ReportesRepositoryPort } from '../../domain/ports/ReportesRepository.port';
import type { PadronLicencias } from '../../domain/entities/Reportes.entity';
import { httpClient } from '../http/axios.client';

export class ReportesRepositoryImpl implements ReportesRepositoryPort {
  async padronLicencias(desde?: string, hasta?: string): Promise<PadronLicencias> {
    const { data } = await httpClient.get<PadronLicencias>('/lf-itse/reportes/licencias/', {
      params: desde && hasta ? { desde, hasta } : {},
    });
    return data;
  }
}
