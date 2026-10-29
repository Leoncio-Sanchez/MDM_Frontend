import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '../http/axios.client';
import { ExpedientesRepositoryImpl } from './ExpedientesRepository.impl';
import { InspeccionesRepositoryImpl } from './InspeccionesRepository.impl';
import { ItseRepositoryImpl } from './ItseRepository.impl';
import { AuthRepositoryImpl } from './AuthRepository.impl';
import { ConsultaPublicaRepositoryImpl } from './ConsultaPublicaRepository.impl';
import type { NuevaActa } from '../../domain/entities/Inspecciones.entity';

/**
 * Contrato con el backend (MDM_BACKEND): cada acción llama al endpoint y con los nombres de
 * campos que el servidor espera. Si el backend cambia una ruta, aquí se nota antes que en uso.
 */

beforeEach(() => {
  vi.spyOn(httpClient, 'get').mockResolvedValue({ data: {} });
  vi.spyOn(httpClient, 'post').mockResolvedValue({ data: {} });
  vi.spyOn(httpClient, 'put').mockResolvedValue({ data: {} });
});

const DENEGATORIA = { fecha_rechazo: '2026-10-29', documento: 'RES. 045-2026', observaciones: 'No se subsanaron las observaciones' };

describe('contrato con la API', () => {
  it('cada denegatoria va a su endpoint', async () => {
    const expedientes = new ExpedientesRepositoryImpl();
    await expedientes.denegar(26, 'ITSE', DENEGATORIA);
    await expedientes.denegar(26, 'LF', DENEGATORIA);

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/lf-itse/expedientes/26/denegar-itse/', DENEGATORIA);
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/lf-itse/expedientes/26/denegar-licencia/', DENEGATORIA);
  });

  it('la cuenta del ciudadano usa sus endpoints públicos y deja la sesión iniciada', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: { access: 'tok', refresh: 'ref' } });
    vi.mocked(httpClient.get).mockResolvedValue({ data: { id: 9, username: 'ciu_12345678', email: '', role: 'CIUDADANO', permisos: {} } });
    const auth = new AuthRepositoryImpl();
    const datos = { documento: '12345678', numero_expediente: 1250, clave: 'Bodega2026', clave_confirmation: 'Bodega2026' };

    const sesion = await auth.registrarCiudadano(datos);
    await auth.restablecerClaveCiudadano(datos);
    await auth.ingresarCiudadano('12345678', 'Bodega2026');

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/publico/cuenta/registro/', datos);
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/publico/cuenta/restablecer/', datos);
    expect(httpClient.post).toHaveBeenNthCalledWith(3, '/publico/cuenta/ingresar/', { documento: '12345678', clave: 'Bodega2026' });
    expect(sesion).toMatchObject({ token: 'tok', user: { role: 'CIUDADANO' } });
    expect(localStorage.getItem('auth-refresh-token')).toBe('ref');

    await new ConsultaPublicaRepositoryImpl().misTramites();
    expect(httpClient.get).toHaveBeenLastCalledWith('/ciudadano/mis-tramites/');
  });

  it('el certificado ITSE consulta el acta que lo sustenta', async () => {
    await new ItseRepositoryImpl().getInspeccionDeExpediente(26);
    expect(httpClient.get).toHaveBeenCalledWith('/lf-itse/itse/expedientes/26/inspeccion/');
  });

  it('el inspector ve las actas por su bandeja y la oficina directamente', async () => {
    const inspecciones = new InspeccionesRepositoryImpl();
    await inspecciones.acta(7, 'inspector');
    await inspecciones.acta(7, 'oficina');

    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/lf-itse/inspecciones/mi-bandeja/actas/7/');
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/lf-itse/inspecciones/actas/7/');
  });

  it('asignar, reprogramar y reasignar envían el equipo de acompañantes', async () => {
    const inspecciones = new InspeccionesRepositoryImpl();
    const local = { nombre_comercial: 'BODEGA', direccion: 'JR. LIMA 1', fecha_programada: null, indicaciones: null, acompanantes: [2, 3] };

    await inspecciones.asignar({ ...local, expediente_id: 26, inspector_id: 1 });
    await inspecciones.actualizar(40, local);
    await inspecciones.reasignar(40, { inspector_id: 2, acompanantes: [3], motivo: 'Descanso médico del inspector', fecha_programada: null, indicaciones: null });

    expect(httpClient.post).toHaveBeenCalledWith('/lf-itse/inspecciones/asignaciones/', expect.objectContaining({ inspector_id: 1, acompanantes: [2, 3] }));
    expect(httpClient.put).toHaveBeenCalledWith('/lf-itse/inspecciones/asignaciones/40/', expect.objectContaining({ acompanantes: [2, 3] }));
    expect(httpClient.post).toHaveBeenCalledWith('/lf-itse/inspecciones/asignaciones/40/reasignar/', expect.objectContaining({ acompanantes: [3] }));
  });

  it('el acta viaja como formulario con sus fotos, en el formato que valida el servidor', async () => {
    const fachada = new File(['x'], 'fachada.jpg', { type: 'image/jpeg' });
    const extintor = new File(['y'], 'extintor.jpg', { type: 'image/jpeg' });
    const acta: NuevaActa = {
      numero_acta: 'ACTA-012-2026',
      fecha_visita: '2026-10-29T10:00:00-05:00',
      area_m2: 45.5,
      aforo: 30,
      extintores: 'CUMPLE',
      senalizacion: 'NO_CUMPLE',
      luces_emergencia: 'CUMPLE',
      tableros_electricos: 'NO_APLICA',
      observaciones: null,
      plazo_subsanacion_dias: 3,
      fotos: [
        { tipo: 'FACHADA', archivo: fachada },
        { tipo: 'EXTINTORES', archivo: extintor },
      ],
    };

    await new InspeccionesRepositoryImpl().registrarActa(40, acta);

    const [url, formulario] = vi.mocked(httpClient.post).mock.calls[0] as [string, FormData];
    expect(url).toBe('/lf-itse/inspecciones/mi-bandeja/40/acta/');
    expect(Object.fromEntries([...formulario.entries()].filter(([, v]) => typeof v === 'string'))).toEqual({
      numero_acta: 'ACTA-012-2026',
      fecha_visita: '2026-10-29T10:00:00-05:00',
      area_m2: '45.5',
      aforo: '30',
      extintores: 'CUMPLE',
      senalizacion: 'NO_CUMPLE',
      luces_emergencia: 'CUMPLE',
      tableros_electricos: 'NO_APLICA',
      plazo_subsanacion_dias: '3',
      'fotos[0][tipo]': 'FACHADA',
      'fotos[1][tipo]': 'EXTINTORES',
    });
    // Sin observaciones no se manda el campo vacío
    expect(formulario.has('observaciones')).toBe(false);
    expect((formulario.get('fotos[0][archivo]') as File).name).toBe('fachada.jpg');
    expect((formulario.get('fotos[1][archivo]') as File).name).toBe('extintor.jpg');
  });
});
