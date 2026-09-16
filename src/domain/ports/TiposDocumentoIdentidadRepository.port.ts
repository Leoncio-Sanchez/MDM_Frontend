/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/TiposDocumentoIdentidadRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { TiposDocumentoIdentidad } from '../entities/TiposDocumentoIdentidad.entity';

export interface TiposDocumentoIdentidadRepositoryPort {
  getAll(): Promise<TiposDocumentoIdentidad[]>;
  getById(id: number): Promise<TiposDocumentoIdentidad>;
  create(data: Omit<TiposDocumentoIdentidad, 'id'>): Promise<TiposDocumentoIdentidad>;
  update(id: number, data: Partial<TiposDocumentoIdentidad>): Promise<TiposDocumentoIdentidad>;
  delete(id: number): Promise<void>;
}
