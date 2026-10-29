/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/ExpedientesRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type {
  AnularExpedientePayload,
  Denegatoria,
  DenegatoriaPayload,
  Expedientes,
  ExpedientePendiente,
  TipoDenegatoria,
} from '../entities/Expedientes.entity';

export interface ExpedientesRepositoryPort {
  getAll(): Promise<Expedientes[]>;
  getById(id: number): Promise<Expedientes>;
  create(data: Omit<Expedientes, 'id'>): Promise<Expedientes>;
  update(id: number, data: Partial<Expedientes>): Promise<Expedientes>;
  /** Reemplaza al borrado: deja constancia de motivo, fecha y usuario */
  anular(id: number, datos: AnularExpedientePayload): Promise<Expedientes>;
  getPendientes(): Promise<ExpedientePendiente[]>;
  /** ITSE: oficina de ITSE · LF: oficina de licencias */
  denegar(id: number, tipo: TipoDenegatoria, datos: DenegatoriaPayload): Promise<Denegatoria>;
}
