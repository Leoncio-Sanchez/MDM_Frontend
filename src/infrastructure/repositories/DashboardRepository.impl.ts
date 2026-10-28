import type { DashboardRepositoryPort } from '../../domain/ports/DashboardRepository.port';
import type { ResumenGeneral } from '../../domain/entities/ResumenGeneral.entity';
import { httpClient } from '../http/axios.client';

export class DashboardRepositoryImpl implements DashboardRepositoryPort {
  async getResumen(): Promise<ResumenGeneral> {
    const { data } = await httpClient.get<ResumenGeneral>('/lf-itse/dashboard/resumen/');
    return data;
  }
}
