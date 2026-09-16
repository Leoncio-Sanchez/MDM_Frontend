/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/TiposLicenciaRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposLicencia } from '../entities/TiposLicencia.entity';

export interface TiposLicenciaRepositoryPort {
  getAll(): Promise<TiposLicencia[]>;
  getById(id: number): Promise<TiposLicencia>;
  create(data: Omit<TiposLicencia, 'id'>): Promise<TiposLicencia>;
  update(id: number, data: Partial<TiposLicencia>): Promise<TiposLicencia>;
  delete(id: number): Promise<void>;
}
