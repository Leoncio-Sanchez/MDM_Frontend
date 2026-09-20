// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/UnidadesOrganicasRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { UnidadesOrganicasRepositoryPort } from '../../domain/ports/UnidadesOrganicasRepository.port';
import type { UnidadesOrganicas } from '../../domain/entities/UnidadesOrganicas.entity';
import { httpClient } from '../http/axios.client';

export class UnidadesOrganicasRepositoryImpl implements UnidadesOrganicasRepositoryPort {
  private readonly baseUrl = '/lf-itse/unidades-organicas/';

  async getAll(): Promise<UnidadesOrganicas[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<UnidadesOrganicas> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<UnidadesOrganicas, 'id'>): Promise<UnidadesOrganicas> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<UnidadesOrganicas>): Promise<UnidadesOrganicas> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
