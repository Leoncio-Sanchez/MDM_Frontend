import type { ResumenGeneral } from '../entities/ResumenGeneral.entity';

export interface DashboardRepositoryPort {
  getResumen(): Promise<ResumenGeneral>;
}
