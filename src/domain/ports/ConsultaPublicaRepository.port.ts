import type { ConsultaPublicaParams, TramitePublico } from '../entities/ConsultaPublica.entity';

export interface ConsultaPublicaRepositoryPort {
  consultar(params: ConsultaPublicaParams): Promise<TramitePublico[]>;
}
