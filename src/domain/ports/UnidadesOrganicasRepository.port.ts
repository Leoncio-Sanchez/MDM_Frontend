/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/UnidadesOrganicasRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { UnidadesOrganicas } from '../entities/UnidadesOrganicas.entity';

export interface UnidadesOrganicasRepositoryPort {
  getAll(): Promise<UnidadesOrganicas[]>;
  getById(id: number): Promise<UnidadesOrganicas>;
  create(data: Omit<UnidadesOrganicas, 'id'>): Promise<UnidadesOrganicas>;
  update(id: number, data: Partial<UnidadesOrganicas>): Promise<UnidadesOrganicas>;
  delete(id: number): Promise<void>;
}
