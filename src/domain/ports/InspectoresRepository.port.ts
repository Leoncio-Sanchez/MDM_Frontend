/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/InspectoresRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Inspectores } from '../entities/Inspectores.entity';

export interface InspectoresRepositoryPort {
  getAll(): Promise<Inspectores[]>;
  getById(id: number): Promise<Inspectores>;
  create(data: Omit<Inspectores, 'id'>): Promise<Inspectores>;
  update(id: number, data: Partial<Inspectores>): Promise<Inspectores>;
  delete(id: number): Promise<void>;
}
