/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/ExpedientesRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { ExpedientesRepositoryPort } from '../../domain/ports/ExpedientesRepository.port';
import type {
  AnularExpedientePayload,
  Denegatoria,
  DenegatoriaPayload,
  Expedientes,
  ExpedientePendiente,
  TipoDenegatoria,
} from '../../domain/entities/Expedientes.entity';
import { httpClient } from '../http/axios.client';

export class ExpedientesRepositoryImpl implements ExpedientesRepositoryPort {
  private readonly baseUrl = '/lf-itse/expedientes/';

  async getAll(): Promise<Expedientes[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Expedientes> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: Omit<Expedientes, 'id'>): Promise<Expedientes> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Expedientes>): Promise<Expedientes> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async anular(id: number, datos: AnularExpedientePayload): Promise<Expedientes> {
    const { data } = await httpClient.post(`${this.baseUrl}${id}/anular/`, datos);
    return data;
  }

  async getPendientes(): Promise<ExpedientePendiente[]> {
    const { data } = await httpClient.get(`${this.baseUrl}pendientes/`);
    return data;
  }

  async denegar(id: number, tipo: TipoDenegatoria, datos: DenegatoriaPayload): Promise<Denegatoria> {
    const { data } = await httpClient.post(`${this.baseUrl}${id}/denegar-${tipo === 'ITSE' ? 'itse' : 'licencia'}/`, datos);
    return data;
  }
}
