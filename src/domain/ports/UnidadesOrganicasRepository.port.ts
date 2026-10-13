/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/UnidadesOrganicasRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { UnidadesOrganicas, UnidadOrganicaPayload } from '../entities/UnidadesOrganicas.entity';

export interface UnidadesOrganicasRepositoryPort {
  getAll(): Promise<UnidadesOrganicas[]>;
  getById(id: number): Promise<UnidadesOrganicas>;
  create(data: UnidadOrganicaPayload): Promise<UnidadesOrganicas>;
  update(id: number, data: UnidadOrganicaPayload): Promise<UnidadesOrganicas>;
  delete(id: number): Promise<void>;
}
