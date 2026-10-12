import type { Personas, PersonaPayload, OpcionCatalogo, Sexo } from '../entities/Personas.entity';

export interface PersonasRepositoryPort {
  getAll(): Promise<Personas[]>;
  getById(id: number): Promise<Personas>;
  create(data: PersonaPayload): Promise<Personas>;
  update(id: number, data: Partial<PersonaPayload>): Promise<Personas>;
  delete(id: number): Promise<void>;
  getSexos(): Promise<OpcionCatalogo<Sexo>[]>;
}
