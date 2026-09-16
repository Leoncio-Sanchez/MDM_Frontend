/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/EstadosRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { EstadosRepositoryPort } from '../../domain/ports/EstadosRepository.port';
import type { Estados } from '../../domain/entities/Estados.entity';
import { httpClient } from '../http/axios.client';

export class EstadosRepositoryImpl implements EstadosRepositoryPort {
  private readonly baseUrl = '/lf-itse/estados/';

  async getAll(): Promise<Estados[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Estados> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Estados, 'id'>): Promise<Estados> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Estados>): Promise<Estados> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
