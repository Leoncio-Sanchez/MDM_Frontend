/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/NivelesRiesgoRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { NivelesRiesgo } from '../entities/NivelesRiesgo.entity';

export interface NivelesRiesgoRepositoryPort {
  getAll(): Promise<NivelesRiesgo[]>;
  getById(id: number): Promise<NivelesRiesgo>;
  create(data: Omit<NivelesRiesgo, 'id'>): Promise<NivelesRiesgo>;
  update(id: number, data: Partial<NivelesRiesgo>): Promise<NivelesRiesgo>;
  delete(id: number): Promise<void>;
}
