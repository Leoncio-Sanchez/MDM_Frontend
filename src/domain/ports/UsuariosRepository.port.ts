/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/UsuariosRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { Usuarios } from '../entities/Usuarios.entity';

export interface UsuariosRepositoryPort {
  getAll(): Promise<Usuarios[]>;
  getById(id: number): Promise<Usuarios>;
  create(data: Omit<Usuarios, 'id'>): Promise<Usuarios>;
  update(id: number, data: Partial<Usuarios>): Promise<Usuarios>;
  delete(id: number): Promise<void>;
}
