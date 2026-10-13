import type {
  LicenciasFuncionamiento,
  LicenciaPayload,
  InactivarLicenciaPayload,
} from '../entities/LicenciasFuncionamiento.entity';

export interface LicenciasFuncionamientoRepositoryPort {
  getAll(): Promise<LicenciasFuncionamiento[]>;
  create(data: LicenciaPayload): Promise<LicenciasFuncionamiento>;
  update(id: number, data: LicenciaPayload): Promise<LicenciasFuncionamiento>;
  /** Las licencias no se eliminan desde la UI: se inactivan registrando el estado y su sustento. */
  inactivar(data: InactivarLicenciaPayload): Promise<LicenciasFuncionamiento>;
}
