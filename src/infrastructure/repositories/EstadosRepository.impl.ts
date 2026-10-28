import { httpClient } from '../http/axios.client';
import type { PaginatedResponse } from '../../domain/types/PaginatedResponse';
import type { EstadosRepositoryPort } from '../../domain/ports/EstadosRepository.port';
import type { Estados } from '../../domain/entities/Estados.entity';

export class EstadosRepositoryImpl implements EstadosRepositoryPort {
  private readonly baseUrl = '/lf-itse/estados/';

  /** El backend pagina este catálogo: se recorren todas las páginas para tenerlo completo. */
  async getAll(): Promise<Estados[]> {
    const todos: Estados[] = [];
    for (let page = 1; ; page++) {
      const { data } = await httpClient.get<PaginatedResponse<Estados>>(this.baseUrl, {
        params: { page, per_page: 100 },
      });
      todos.push(...data.results);
      if (!data.next || data.results.length === 0) return todos;
    }
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

  async getInactivosItse(): Promise<Estados[]> {
    const { data } = await httpClient.get<Estados[]>(`${this.baseUrl}inactivos-itse/`);
    return data;
  }

  async getInactivosLf(): Promise<Estados[]> {
    const { data } = await httpClient.get<Estados[]>(`${this.baseUrl}inactivos-lf/`);
    return data;
  }
}
