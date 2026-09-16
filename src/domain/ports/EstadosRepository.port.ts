/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/EstadosRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Estados } from '../entities/Estados.entity';

export interface EstadosRepositoryPort {
  getAll(): Promise<Estados[]>;
  getById(id: number): Promise<Estados>;
  create(data: Omit<Estados, 'id'>): Promise<Estados>;
  update(id: number, data: Partial<Estados>): Promise<Estados>;
  delete(id: number): Promise<void>;
}
