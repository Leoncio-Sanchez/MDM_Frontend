/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/ZonificacionesRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Zonificaciones } from '../entities/Zonificaciones.entity';

export interface ZonificacionesRepositoryPort {
  getAll(): Promise<Zonificaciones[]>;
  getById(id: number): Promise<Zonificaciones>;
  create(data: Omit<Zonificaciones, 'id'>): Promise<Zonificaciones>;
  update(id: number, data: Partial<Zonificaciones>): Promise<Zonificaciones>;
  delete(id: number): Promise<void>;
}
