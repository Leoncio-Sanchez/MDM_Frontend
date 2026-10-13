/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/UsuariosRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { UsuariosRepositoryPort } from '../../domain/ports/UsuariosRepository.port';
import type { Usuarios } from '../../domain/entities/Usuarios.entity';
import { httpClient } from '../http/axios.client';

export class UsuariosRepositoryImpl implements UsuariosRepositoryPort {
  private readonly baseUrl = '/lf-itse/usuarios';

  async getAll(): Promise<Usuarios[]> {
    const { data } = await httpClient.get(this.baseUrl);
    return data;
  }

  async getById(id: number): Promise<Usuarios> {
    const { data } = await httpClient.get(`${this.baseUrl}/${id}`);
    return data;
  }

  async create(payload: Omit<Usuarios, 'id'>): Promise<Usuarios> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: Partial<Usuarios>): Promise<Usuarios> {
    const { data } = await httpClient.put(`${this.baseUrl}/${id}`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${this.baseUrl}/${id}`);
  }
}
