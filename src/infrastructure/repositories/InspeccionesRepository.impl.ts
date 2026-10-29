import type { InspeccionesRepositoryPort, VistaActa } from '../../domain/ports/InspeccionesRepository.port';
import {
  GRUPOS_CHECKLIST,
  type ActaInspeccion,
  type AnulacionActa,
  type AsignacionInspeccion,
  type DatosLocalInspeccion,
  type ExpedientePorInspeccionar,
  type InspectorDisponible,
  type NuevaActa,
  type NuevaAsignacion,
  type Reasignacion,
} from '../../domain/entities/Inspecciones.entity';
import { httpClient } from '../http/axios.client';

const BASE = '/lf-itse/inspecciones';

/** El inspector consulta por su bandeja (solo lo suyo); la oficina, directo */
const rutaActa = (actaId: number, vista: VistaActa) =>
  vista === 'inspector' ? `${BASE}/mi-bandeja/actas/${actaId}/` : `${BASE}/actas/${actaId}/`;

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

  async actasDeExpediente(expedienteId: number): Promise<ActaInspeccion[]> {
    const { data } = await httpClient.get<ActaInspeccion[]>(`${BASE}/expedientes/${expedienteId}/actas/`);
    return data;
  }

  async anularActa(actaId: number, datos: AnulacionActa): Promise<ActaInspeccion> {
    const { data } = await httpClient.post<ActaInspeccion>(`${BASE}/actas/${actaId}/anular/`, datos);
    return data;
  }

  async miBandeja(): Promise<AsignacionInspeccion[]> {
    const { data } = await httpClient.get<AsignacionInspeccion[]>(`${BASE}/mi-bandeja/`);
    return data;
  }

  async registrarActa(asignacionId: number, acta: NuevaActa, onProgreso?: (porcentaje: number) => void): Promise<ActaInspeccion> {
    const formulario = new FormData();
    formulario.append('numero_acta', acta.numero_acta);
    formulario.append('fecha_visita', acta.fecha_visita);
    formulario.append('area_m2', String(acta.area_m2));
    formulario.append('aforo', String(acta.aforo));
    for (const { clave } of GRUPOS_CHECKLIST) formulario.append(clave, acta[clave]);
    if (acta.observaciones) formulario.append('observaciones', acta.observaciones);
    if (acta.plazo_subsanacion_dias) formulario.append('plazo_subsanacion_dias', String(acta.plazo_subsanacion_dias));
    acta.fotos.forEach((foto, i) => {
      formulario.append(`fotos[${i}][tipo]`, foto.tipo);
      formulario.append(`fotos[${i}][archivo]`, foto.archivo);
    });

    const { data } = await httpClient.post<ActaInspeccion>(`${BASE}/mi-bandeja/${asignacionId}/acta/`, formulario, {
      // Sin esto axios enviaría JSON y las fotos se perderían
      headers: { 'Content-Type': 'multipart/form-data' },
      // Desde el celular, con señal débil, la subida puede tardar
      timeout: 180_000,
      onUploadProgress: (e) => {
        if (onProgreso && e.total) onProgreso(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data;
  }

  async acta(actaId: number, vista: VistaActa): Promise<ActaInspeccion> {
    const { data } = await httpClient.get<ActaInspeccion>(rutaActa(actaId, vista));
    return data;
  }

  async fotoActa(actaId: number, fotoId: number, vista: VistaActa): Promise<Blob> {
    const { data } = await httpClient.get<Blob>(`${rutaActa(actaId, vista)}fotos/${fotoId}/`, {
      responseType: 'blob',
      timeout: 60_000,
    });
    return data;
  }
}
