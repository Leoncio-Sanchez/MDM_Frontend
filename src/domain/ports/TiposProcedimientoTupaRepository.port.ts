/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/TiposProcedimientoTupaRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposProcedimientoTupa, TipoProcedimientoTupaPayload } from '../entities/TiposProcedimientoTupa.entity';

export interface TiposProcedimientoTupaRepositoryPort {
  getAll(): Promise<TiposProcedimientoTupa[]>;
  getById(id: number): Promise<TiposProcedimientoTupa>;
  create(data: TipoProcedimientoTupaPayload): Promise<TiposProcedimientoTupa>;
  update(id: number, data: Partial<TipoProcedimientoTupaPayload>): Promise<TiposProcedimientoTupa>;
  delete(id: number): Promise<void>;
}
