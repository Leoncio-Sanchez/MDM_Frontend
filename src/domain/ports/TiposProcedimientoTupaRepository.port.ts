/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/TiposProcedimientoTupaRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposProcedimientoTupa } from '../entities/TiposProcedimientoTupa.entity';

export interface TiposProcedimientoTupaRepositoryPort {
  getAll(): Promise<TiposProcedimientoTupa[]>;
  getById(id: number): Promise<TiposProcedimientoTupa>;
  create(data: Omit<TiposProcedimientoTupa, 'id'>): Promise<TiposProcedimientoTupa>;
  update(id: number, data: Partial<TiposProcedimientoTupa>): Promise<TiposProcedimientoTupa>;
  delete(id: number): Promise<void>;
}
