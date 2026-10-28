import type { ConfiguracionInforme } from '../entities/Configuracion.entity';

export interface ConfiguracionRepositoryPort {
  informe(): Promise<ConfiguracionInforme>;
  guardarInforme(datos: ConfiguracionInforme): Promise<ConfiguracionInforme>;
}
