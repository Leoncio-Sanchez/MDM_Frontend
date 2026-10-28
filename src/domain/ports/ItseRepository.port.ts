import type { Itse, ItsePayload, InactivarItsePayload, FiltroPorRenovar } from '../entities/Itse.entity';

export interface ItseRepositoryPort {
  getAll(): Promise<Itse[]>;
  getById(id: number): Promise<Itse>;
  create(data: ItsePayload): Promise<Itse>;
  update(id: number, data: ItsePayload): Promise<Itse>;
  /** Los ITSE no se eliminan: se inactivan registrando un estado con su sustento. */
  inactivar(data: InactivarItsePayload): Promise<Itse>;
  /** Vigentes que caducan en el rango y aún no se renovaron (del más próximo al más lejano). */
  getPorRenovar(filtro: FiltroPorRenovar): Promise<Itse[]>;
}
