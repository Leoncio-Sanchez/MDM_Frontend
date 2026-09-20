// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/NivelesRiesgoRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { NivelesRiesgoRepositoryPort } from '../../domain/ports/NivelesRiesgoRepository.port';
import type { NivelesRiesgo } from '../../domain/entities/NivelesRiesgo.entity';
import { httpClient } from '../http/axios.client';

export class NivelesRiesgoRepositoryImpl implements NivelesRiesgoRepositoryPort {
  private readonly baseUrl = '/lf-itse/niveles-riesgo/';

  async getAll(): Promise<NivelesRiesgo[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<NivelesRiesgo> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<NivelesRiesgo, 'id'>): Promise<NivelesRiesgo> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<NivelesRiesgo>): Promise<NivelesRiesgo> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
