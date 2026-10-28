import type { ConfiguracionRepositoryPort } from '../../domain/ports/ConfiguracionRepository.port';
import type { ConfiguracionInforme } from '../../domain/entities/Configuracion.entity';
import { httpClient } from '../http/axios.client';

export class ConfiguracionRepositoryImpl implements ConfiguracionRepositoryPort {
  async informe(): Promise<ConfiguracionInforme> {
    const { data } = await httpClient.get<ConfiguracionInforme>('/lf-itse/configuracion/informes/');
    return data;
  }

  async guardarInforme(datos: ConfiguracionInforme): Promise<ConfiguracionInforme> {
    const { data } = await httpClient.put<ConfiguracionInforme>('/lf-itse/configuracion/informes/', datos);
    return data;
  }
}
