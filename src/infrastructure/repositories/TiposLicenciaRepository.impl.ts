/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/TiposLicenciaRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposLicenciaRepositoryPort } from '../../domain/ports/TiposLicenciaRepository.port';
import type { TiposLicencia } from '../../domain/entities/TiposLicencia.entity';
import { httpClient } from '../http/axios.client';

export class TiposLicenciaRepositoryImpl implements TiposLicenciaRepositoryPort {
  private readonly baseUrl = '/lf-itse/tipos-licencia/';

  async getAll(): Promise<TiposLicencia[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<TiposLicencia> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<TiposLicencia, 'id'>): Promise<TiposLicencia> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<TiposLicencia>): Promise<TiposLicencia> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
