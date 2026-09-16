/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/ItseRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Itse } from '../entities/Itse.entity';

export interface ItseRepositoryPort {
  getAll(): Promise<Itse[]>;
  getById(id: number): Promise<Itse>;
  create(data: Omit<Itse, 'id'>): Promise<Itse>;
  update(id: number, data: Partial<Itse>): Promise<Itse>;
  delete(id: number): Promise<void>;
}
