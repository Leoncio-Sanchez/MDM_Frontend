/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/ExpedientesRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Expedientes, ExpedientePendiente } from '../entities/Expedientes.entity';

export interface ExpedientesRepositoryPort {
  getAll(): Promise<Expedientes[]>;
  getById(id: number): Promise<Expedientes>;
  create(data: Omit<Expedientes, 'id'>): Promise<Expedientes>;
  update(id: number, data: Partial<Expedientes>): Promise<Expedientes>;
  delete(id: number): Promise<void>;
  getPendientes(): Promise<ExpedientePendiente[]>;
}
