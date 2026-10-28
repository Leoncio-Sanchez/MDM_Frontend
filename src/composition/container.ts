import { AuthRepositoryImpl } from '../infrastructure/repositories/AuthRepository.impl';
import { ConsultaPublicaRepositoryImpl } from '../infrastructure/repositories/ConsultaPublicaRepository.impl';
import { DashboardRepositoryImpl } from '../infrastructure/repositories/DashboardRepository.impl';
import { PideRepositoryImpl } from '../infrastructure/repositories/PideRepository.impl';
import { EstadosRepositoryImpl } from '../infrastructure/repositories/EstadosRepository.impl';
import { ExpedientesRepositoryImpl } from '../infrastructure/repositories/ExpedientesRepository.impl';
import { GirosRepositoryImpl } from '../infrastructure/repositories/GirosRepository.impl';
import { InspectoresRepositoryImpl } from '../infrastructure/repositories/InspectoresRepository.impl';
import { ItseRepositoryImpl } from '../infrastructure/repositories/ItseRepository.impl';
import { LicenciasFuncionamientoRepositoryImpl } from '../infrastructure/repositories/LicenciasFuncionamientoRepository.impl';
import { NivelesRiesgoRepositoryImpl } from '../infrastructure/repositories/NivelesRiesgoRepository.impl';
import { PersonasRepositoryImpl } from '../infrastructure/repositories/PersonasRepository.impl';
import { TiposDocumentoIdentidadRepositoryImpl } from '../infrastructure/repositories/TiposDocumentoIdentidadRepository.impl';
import { TiposLicenciaRepositoryImpl } from '../infrastructure/repositories/TiposLicenciaRepository.impl';
import { TiposProcedimientoTupaRepositoryImpl } from '../infrastructure/repositories/TiposProcedimientoTupaRepository.impl';
import { UnidadesOrganicasRepositoryImpl } from '../infrastructure/repositories/UnidadesOrganicasRepository.impl';
import { UsuariosRepositoryImpl } from '../infrastructure/repositories/UsuariosRepository.impl';
import { ZonificacionesRepositoryImpl } from '../infrastructure/repositories/ZonificacionesRepository.impl';

import type { AuthRepositoryPort } from '../domain/ports/AuthRepository.port';
import type { ConsultaPublicaRepositoryPort } from '../domain/ports/ConsultaPublicaRepository.port';
import type { DashboardRepositoryPort } from '../domain/ports/DashboardRepository.port';
import type { PideServicePort } from '../domain/ports/ExternalServices.port';
import type { EstadosRepositoryPort } from '../domain/ports/EstadosRepository.port';
import type { ExpedientesRepositoryPort } from '../domain/ports/ExpedientesRepository.port';
import type { GirosRepositoryPort } from '../domain/ports/GirosRepository.port';
import type { InspectoresRepositoryPort } from '../domain/ports/InspectoresRepository.port';
import type { ItseRepositoryPort } from '../domain/ports/ItseRepository.port';
import type { LicenciasFuncionamientoRepositoryPort } from '../domain/ports/LicenciasFuncionamientoRepository.port';
import type { NivelesRiesgoRepositoryPort } from '../domain/ports/NivelesRiesgoRepository.port';
import type { PersonasRepositoryPort } from '../domain/ports/PersonasRepository.port';
import type { TiposDocumentoIdentidadRepositoryPort } from '../domain/ports/TiposDocumentoIdentidadRepository.port';
import type { TiposLicenciaRepositoryPort } from '../domain/ports/TiposLicenciaRepository.port';
import type { TiposProcedimientoTupaRepositoryPort } from '../domain/ports/TiposProcedimientoTupaRepository.port';
import type { UnidadesOrganicasRepositoryPort } from '../domain/ports/UnidadesOrganicasRepository.port';
import type { UsuariosRepositoryPort } from '../domain/ports/UsuariosRepository.port';
import type { ZonificacionesRepositoryPort } from '../domain/ports/ZonificacionesRepository.port';

export interface Container {
  auth: AuthRepositoryPort;
  consultaPublica: ConsultaPublicaRepositoryPort;
  dashboard: DashboardRepositoryPort;
  pide: PideServicePort;
  estados: EstadosRepositoryPort;
  expedientes: ExpedientesRepositoryPort;
  giros: GirosRepositoryPort;
  inspectores: InspectoresRepositoryPort;
  itse: ItseRepositoryPort;
  licenciasFuncionamiento: LicenciasFuncionamientoRepositoryPort;
  nivelesRiesgo: NivelesRiesgoRepositoryPort;
  personas: PersonasRepositoryPort;
  tiposDocumentoIdentidad: TiposDocumentoIdentidadRepositoryPort;
  tiposLicencia: TiposLicenciaRepositoryPort;
  tiposProcedimientoTupa: TiposProcedimientoTupaRepositoryPort;
  unidadesOrganicas: UnidadesOrganicasRepositoryPort;
  usuarios: UsuariosRepositoryPort;
  zonificaciones: ZonificacionesRepositoryPort;
}

export const container: Container = {
  auth: new AuthRepositoryImpl(),
  consultaPublica: new ConsultaPublicaRepositoryImpl(),
  dashboard: new DashboardRepositoryImpl(),
  pide: new PideRepositoryImpl(),
  estados: new EstadosRepositoryImpl(),
  expedientes: new ExpedientesRepositoryImpl(),
  giros: new GirosRepositoryImpl(),
  inspectores: new InspectoresRepositoryImpl(),
  itse: new ItseRepositoryImpl(),
  licenciasFuncionamiento: new LicenciasFuncionamientoRepositoryImpl(),
  nivelesRiesgo: new NivelesRiesgoRepositoryImpl(),
  personas: new PersonasRepositoryImpl(),
  tiposDocumentoIdentidad: new TiposDocumentoIdentidadRepositoryImpl(),
  tiposLicencia: new TiposLicenciaRepositoryImpl(),
  tiposProcedimientoTupa: new TiposProcedimientoTupaRepositoryImpl(),
  unidadesOrganicas: new UnidadesOrganicasRepositoryImpl(),
  usuarios: new UsuariosRepositoryImpl(),
  zonificaciones: new ZonificacionesRepositoryImpl(),
};
