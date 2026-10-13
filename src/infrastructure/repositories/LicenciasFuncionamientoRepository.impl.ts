import type { LicenciasFuncionamientoRepositoryPort } from '../../domain/ports/LicenciasFuncionamientoRepository.port';
import type {
  LicenciasFuncionamiento,
  LicenciaPayload,
  InactivarLicenciaPayload,
} from '../../domain/entities/LicenciasFuncionamiento.entity';
import { httpClient } from '../http/axios.client';

export class LicenciasFuncionamientoRepositoryImpl implements LicenciasFuncionamientoRepositoryPort {
  private readonly baseUrl = '/lf-itse/licencias-funcionamiento';

  async getAll(): Promise<LicenciasFuncionamiento[]> {
    const { data } = await httpClient.get(`${this.baseUrl}/consulta`);
    return data;
  }

  async create(payload: LicenciaPayload): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.post(this.baseUrl, payload);
    return data;
  }

  async update(id: number, payload: LicenciaPayload): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.put(`${this.baseUrl}/${id}`, payload);
    return data;
  }

  async inactivar(payload: InactivarLicenciaPayload): Promise<LicenciasFuncionamiento> {
    const { data } = await httpClient.post(`${this.baseUrl}/inactivar`, payload);
    return data;
  }
}
