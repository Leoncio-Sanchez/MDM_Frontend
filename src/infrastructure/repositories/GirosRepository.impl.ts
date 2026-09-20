// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/GirosRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { GirosRepositoryPort } from '../../domain/ports/GirosRepository.port';
import type { Giros } from '../../domain/entities/Giros.entity';
import { httpClient } from '../http/axios.client';

export class GirosRepositoryImpl implements GirosRepositoryPort {
  private readonly baseUrl = '/lf-itse/giros/';

  async getAll(): Promise<Giros[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Giros> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Giros, 'id'>): Promise<Giros> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Giros>): Promise<Giros> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
