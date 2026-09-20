// TODO(MIGRATION): Este repositorio apunta a Django (8000).
// Será refactorizado cuando el módulo migre a Laravel (FASE 3+).
/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/ZonificacionesRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { ZonificacionesRepositoryPort } from '../../domain/ports/ZonificacionesRepository.port';
import type { Zonificaciones } from '../../domain/entities/Zonificaciones.entity';
import { httpClient } from '../http/axios.client';

export class ZonificacionesRepositoryImpl implements ZonificacionesRepositoryPort {
  private readonly baseUrl = '/lf-itse/zonificaciones/';

  async getAll(): Promise<Zonificaciones[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Zonificaciones> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Zonificaciones, 'id'>): Promise<Zonificaciones> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Zonificaciones>): Promise<Zonificaciones> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }
}
