import type { ConsultaPublicaParams, MisTramites, TramitePublico } from '../entities/ConsultaPublica.entity';

export interface ConsultaPublicaRepositoryPort {
  consultar(params: ConsultaPublicaParams): Promise<TramitePublico[]>;
  /** Con la sesión del ciudadano */
  misTramites(): Promise<MisTramites>;
}
