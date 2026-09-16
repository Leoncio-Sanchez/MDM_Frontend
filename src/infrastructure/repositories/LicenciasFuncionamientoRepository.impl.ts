/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/LicenciasFuncionamientoRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { LicenciasFuncionamientoRepositoryPort } from '../../domain/ports/LicenciasFuncionamientoRepository.port';
import type { LicenciasFuncionamiento } from '../../domain/entities/LicenciasFuncionamiento.entity';
import { httpClient } from '../http/axios.client';

export class LicenciasFuncionamientoRepositoryImpl implements LicenciasFuncionamientoRepositoryPort {
  private readonly baseUrl = '/lf-itse/licencias-funcionamiento/';

  async getAll(): Promise<LicenciasFuncionamiento[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<LicenciasFuncionamiento, 'id'>): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<LicenciasFuncionamiento>): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
