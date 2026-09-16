/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/GirosRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Giros } from '../entities/Giros.entity';

export interface GirosRepositoryPort {
  getAll(): Promise<Giros[]>;
  getById(id: number): Promise<Giros>;
  create(data: Omit<Giros, 'id'>): Promise<Giros>;
  update(id: number, data: Partial<Giros>): Promise<Giros>;
  delete(id: number): Promise<void>;
}
