import type { ConsultaPublicaRepositoryPort } from '../../domain/ports/ConsultaPublicaRepository.port';
import type { ConsultaPublicaParams, MisTramites, TramitePublico } from '../../domain/entities/ConsultaPublica.entity';
import { httpClient } from '../http/axios.client';

export class ConsultaPublicaRepositoryImpl implements ConsultaPublicaRepositoryPort {
  async consultar(params: ConsultaPublicaParams): Promise<TramitePublico[]> {
    const { data } = await httpClient.get<TramitePublico[]>('/publico/consulta/', { params });
    return data;
  }

  async misTramites(): Promise<MisTramites> {
    const { data } = await httpClient.get<MisTramites>('/ciudadano/mis-tramites/');
    return data;
  }
}
