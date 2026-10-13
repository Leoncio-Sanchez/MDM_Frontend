// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/TiposProcedimientoTupaRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposProcedimientoTupaRepositoryPort } from '../../domain/ports/TiposProcedimientoTupaRepository.port';
import type { TiposProcedimientoTupa, TipoProcedimientoTupaPayload } from '../../domain/entities/TiposProcedimientoTupa.entity';
import { httpClient } from '../http/axios.client';

export class TiposProcedimientoTupaRepositoryImpl implements TiposProcedimientoTupaRepositoryPort {
  private readonly baseUrl = '/lf-itse/tipos-procedimiento-tupa/';

  async getAll(): Promise<TiposProcedimientoTupa[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<TiposProcedimientoTupa> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: TipoProcedimientoTupaPayload): Promise<TiposProcedimientoTupa> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<TipoProcedimientoTupaPayload>): Promise<TiposProcedimientoTupa> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
