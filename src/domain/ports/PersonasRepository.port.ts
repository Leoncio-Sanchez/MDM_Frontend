/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/PersonasRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Personas } from '../entities/Personas.entity';

export interface PersonasRepositoryPort {
  getAll(): Promise<Personas[]>;
  getById(id: number): Promise<Personas>;
  create(data: Omit<Personas, 'id'>): Promise<Personas>;
  update(id: number, data: Partial<Personas>): Promise<Personas>;
  delete(id: number): Promise<void>;
}
