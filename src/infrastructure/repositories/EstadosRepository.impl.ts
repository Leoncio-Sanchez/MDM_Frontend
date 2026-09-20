import { httpClient } from '../http/axios.client';
import type { PaginatedResponse } from '../../domain/types/PaginatedResponse';
import type { EstadosRepositoryPort } from '../../domain/ports/EstadosRepository.port';
import type { Estados } from '../../domain/entities/Estados.entity';

export class EstadosRepositoryImpl implements EstadosRepositoryPort {
  private readonly baseUrl = '/lf-itse/estados/';

  async getAll(params?: { page?: number }): Promise<PaginatedResponse<Estados>> {
    const { data } = await httpClient.get<PaginatedResponse<Estados>>(this.baseUrl, {
      params: { page: params?.page ?? 1 },
    });
    return data;
  }

  async getById(id: number): Promise<Estados> {
    const { data } = await httpClient.get<Estados>(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Estados, 'id'>): Promise<Estados> {
    const { data } = await httpClient.post<Estados>(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Estados>): Promise<Estados> {
    const { data } = await httpClient.put<Estados>(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
