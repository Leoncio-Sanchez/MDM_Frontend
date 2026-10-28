import type { ItseRepositoryPort } from '../../domain/ports/ItseRepository.port';
import type { Itse, ItsePayload, InactivarItsePayload, FiltroPorRenovar } from '../../domain/entities/Itse.entity';
import { httpClient } from '../http/axios.client';

export class ItseRepositoryImpl implements ItseRepositoryPort {
  private readonly baseUrl = '/lf-itse/itse/';

  async getAll(): Promise<Itse[]> {
    const { data } = await httpClient.get(`${this.baseUrl}consulta/`);
    return data;
  }

  async getPorRenovar(filtro: FiltroPorRenovar): Promise<Itse[]> {
    const { data } = await httpClient.get(`${this.baseUrl}por-renovar/`, { params: filtro });
    return data;
  }

  async getById(id: number): Promise<Itse> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: ItsePayload): Promise<Itse> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: ItsePayload): Promise<Itse> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async inactivar(payload: InactivarItsePayload): Promise<Itse> {
    const { data } = await httpClient.post(`${this.baseUrl}inactivar/`, payload);
    return data;
  }
}
