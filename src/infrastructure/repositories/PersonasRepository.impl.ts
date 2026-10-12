import type { PersonasRepositoryPort } from '../../domain/ports/PersonasRepository.port';
import type { Personas, PersonaPayload, OpcionCatalogo, Sexo } from '../../domain/entities/Personas.entity';
import { httpClient } from '../http/axios.client';

export class PersonasRepositoryImpl implements PersonasRepositoryPort {
  private readonly baseUrl = '/lf-itse/personas/';

  async getAll(): Promise<Personas[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Personas> {
    const { data } = await httpClient.get(`${this.baseUrl}${id}/`);
    return data;
  }

  async create(payload: PersonaPayload): Promise<Personas> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<PersonaPayload>): Promise<Personas> {
    const { data } = await httpClient.put(`${this.baseUrl}${id}/`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}${id}/`);
  }

  async getSexos(): Promise<OpcionCatalogo<Sexo>[]> {
    const { data } = await httpClient.get(`${this.baseUrl}sexos/`);
    return data;
  }
}
