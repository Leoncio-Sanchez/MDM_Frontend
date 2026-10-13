/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/InspectoresRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { InspectoresRepositoryPort } from '../../domain/ports/InspectoresRepository.port';
import type { Inspectores } from '../../domain/entities/Inspectores.entity';
import { httpClient } from '../http/axios.client';

export class InspectoresRepositoryImpl implements InspectoresRepositoryPort {
  private readonly baseUrl = '/lf-itse/inspectores/';

  async getAll(): Promise<Inspectores[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Inspectores> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Inspectores, 'id'>): Promise<Inspectores> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Inspectores>): Promise<Inspectores> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
