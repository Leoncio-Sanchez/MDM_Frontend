/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/TiposDocumentoIdentidadRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposDocumentoIdentidadRepositoryPort } from '../../domain/ports/TiposDocumentoIdentidadRepository.port';
import type { TiposDocumentoIdentidad } from '../../domain/entities/TiposDocumentoIdentidad.entity';
import { httpClient } from '../http/axios.client';

export class TiposDocumentoIdentidadRepositoryImpl implements TiposDocumentoIdentidadRepositoryPort {
  private readonly baseUrl = '/lf-itse/tipos-documento-identidad/';

  async getAll(): Promise<TiposDocumentoIdentidad[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<TiposDocumentoIdentidad> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<TiposDocumentoIdentidad, 'id'>): Promise<TiposDocumentoIdentidad> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<TiposDocumentoIdentidad>): Promise<TiposDocumentoIdentidad> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
