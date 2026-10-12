import type { PaginatedResponse } from '../types/PaginatedResponse';
import type { Estados } from '../entities/Estados.entity';

export interface EstadosRepositoryPort {
  getAll(params?: { page?: number }): Promise<PaginatedResponse<Estados>>;
  getById(id: number): Promise<Estados>;
  create(payload: Omit<Estados, 'id'>): Promise<Estados>;
  update(id: number, payload: Partial<Estados>): Promise<Estados>;
  delete(id: number): Promise<void>;
  /** Estados inactivos aplicables a ITSE (motivos de inactivación) */
  getInactivosItse(): Promise<Estados[]>;
}
