import type { ConsultaPublicaRepositoryPort } from '../../domain/ports/ConsultaPublicaRepository.port';
import type { ConsultaPublicaParams, TramitePublico } from '../../domain/entities/ConsultaPublica.entity';
import { httpClient } from '../http/axios.client';

export class ConsultaPublicaRepositoryImpl implements ConsultaPublicaRepositoryPort {
  async consultar(params: ConsultaPublicaParams): Promise<TramitePublico[]> {
    const { data } = await httpClient.get<TramitePublico[]>('/publico/consulta/', { params });
    return data;
  }
}
