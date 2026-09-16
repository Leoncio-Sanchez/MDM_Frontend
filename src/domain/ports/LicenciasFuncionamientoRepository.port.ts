/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/LicenciasFuncionamientoRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { LicenciasFuncionamiento } from '../entities/LicenciasFuncionamiento.entity';

export interface LicenciasFuncionamientoRepositoryPort {
  getAll(): Promise<LicenciasFuncionamiento[]>;
  getById(id: number): Promise<LicenciasFuncionamiento>;
  create(data: Omit<LicenciasFuncionamiento, 'id'>): Promise<LicenciasFuncionamiento>;
  update(id: number, data: Partial<LicenciasFuncionamiento>): Promise<LicenciasFuncionamiento>;
  delete(id: number): Promise<void>;
}
