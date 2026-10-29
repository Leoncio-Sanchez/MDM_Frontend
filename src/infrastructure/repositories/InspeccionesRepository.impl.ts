import type { InspeccionesRepositoryPort } from '../../domain/ports/InspeccionesRepository.port';
import type {
  AsignacionInspeccion,
  DatosLocalInspeccion,
  ExpedientePorInspeccionar,
  InspectorDisponible,
  NuevaAsignacion,
  Reasignacion,
} from '../../domain/entities/Inspecciones.entity';
import { httpClient } from '../http/axios.client';

const BASE = '/lf-itse/inspecciones';

export class InspeccionesRepositoryImpl implements InspeccionesRepositoryPort {
  async porInspeccionar(): Promise<ExpedientePorInspeccionar[]> {
    const { data } = await httpClient.get<ExpedientePorInspeccionar[]>(`${BASE}/por-inspeccionar/`);
    return data;
  }

  async inspectores(): Promise<InspectorDisponible[]> {
    const { data } = await httpClient.get<InspectorDisponible[]>(`${BASE}/inspectores/`);
    return data;
  }

  async asignar(datos: NuevaAsignacion): Promise<AsignacionInspeccion> {
    const { data } = await httpClient.post<AsignacionInspeccion>(`${BASE}/asignaciones/`, datos);
    return data;
  }

  async actualizar(asignacionId: number, datos: DatosLocalInspeccion): Promise<AsignacionInspeccion> {
    const { data } = await httpClient.put<AsignacionInspeccion>(`${BASE}/asignaciones/${asignacionId}/`, datos);
    return data;
  }

  async reasignar(asignacionId: number, datos: Reasignacion): Promise<AsignacionInspeccion> {
    const { data } = await httpClient.post<AsignacionInspeccion>(`${BASE}/asignaciones/${asignacionId}/reasignar/`, datos);
    return data;
  }

  async historial(expedienteId: number): Promise<AsignacionInspeccion[]> {
    const { data } = await httpClient.get<AsignacionInspeccion[]>(`${BASE}/expedientes/${expedienteId}/historial/`);
    return data;
  }

  async miBandeja(): Promise<AsignacionInspeccion[]> {
    const { data } = await httpClient.get<AsignacionInspeccion[]>(`${BASE}/mi-bandeja/`);
    return data;
  }
}
