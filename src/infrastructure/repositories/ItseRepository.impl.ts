// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/ItseRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { ItseRepositoryPort } from '../../domain/ports/ItseRepository.port';
import type { Itse } from '../../domain/entities/Itse.entity';
import { httpClient } from '../http/axios.client';

export class ItseRepositoryImpl implements ItseRepositoryPort {
  private readonly baseUrl = '/lf-itse/itse/';

  async getAll(): Promise<Itse[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Itse> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Itse, 'id'>): Promise<Itse> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Itse>): Promise<Itse> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
