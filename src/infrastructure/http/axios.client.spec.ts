import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios';
import { httpClient } from './axios.client';

/**
 * Sesión con JWT: el token viaja en cada petición y, cuando vence (401), se renueva una sola
 * vez con el refresh token y se repiten las peticiones que fallaron. Si no se puede renovar,
 * se cierra la sesión.
 */

const guardarSesion = (token: string, refresh: string | null = 'refresh-1') => {
  localStorage.setItem('auth-storage', JSON.stringify({ token, user: { username: 'prueba' } }));
  if (refresh) localStorage.setItem('auth-refresh-token', refresh);
};

const tokenGuardado = () => JSON.parse(localStorage.getItem('auth-storage') ?? '{}').token;

const respuesta = (config: InternalAxiosRequestConfig, status: number, data: unknown = {}) => {
  const res = { data, status, statusText: String(status), headers: {}, config };
  if (status >= 400) throw new AxiosError(`HTTP ${status}`, String(status), config, null, res);
  return res;
};

/** Servidor simulado: responde 401 a todo token que no sea el vigente */
const servidor = (tokenVigente: string) =>
  vi.fn<AxiosAdapter>(async (config) =>
    respuesta(config, config.headers.Authorization === `Bearer ${tokenVigente}` ? 200 : 401, { url: config.url }),
  );

beforeEach(() => {
  localStorage.clear();
  delete httpClient.defaults.headers.common.Authorization;
  // jsdom no navega: la redirección al login solo deja un aviso en consola
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('cliente HTTP', () => {
  it('envía el token de la sesión en cada petición', async () => {
    guardarSesion('token-1');
    const adaptador = servidor('token-1');
    httpClient.defaults.adapter = adaptador;

    await httpClient.get('/lf-itse/expedientes/');

    expect(adaptador.mock.calls[0][0].headers.Authorization).toBe('Bearer token-1');
  });

  it('si el token venció, lo renueva y repite la petición', async () => {
    guardarSesion('token-vencido');
    httpClient.defaults.adapter = servidor('token-nuevo');
    const renovar = vi.spyOn(axios, 'post').mockResolvedValue({ data: { access: 'token-nuevo', refresh: 'refresh-2' } });

    const { data } = await httpClient.get('/lf-itse/itse/consulta/');

    expect(data).toEqual({ url: '/lf-itse/itse/consulta/' });
    expect(renovar).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/jwt\/refresh\/$/), { refresh: 'refresh-1' });
    expect(tokenGuardado()).toBe('token-nuevo');
    expect(localStorage.getItem('auth-refresh-token')).toBe('refresh-2');
  });

  it('con varias peticiones vencidas a la vez, renueva una sola vez', async () => {
    guardarSesion('token-vencido');
    httpClient.defaults.adapter = servidor('token-nuevo');
    let terminarRenovacion: (valor: unknown) => void = () => undefined;
    const renovar = vi.spyOn(axios, 'post').mockReturnValue(new Promise((resolve) => (terminarRenovacion = resolve)));

    const peticiones = Promise.all([
      httpClient.get('/lf-itse/dashboard/resumen'),
      httpClient.get('/lf-itse/expedientes/pendientes/'),
      httpClient.get('/lf-itse/giros/'),
    ]);
    await vi.waitFor(() => expect(renovar).toHaveBeenCalled());
    terminarRenovacion({ data: { access: 'token-nuevo' } });

    const resultados = await peticiones;
    expect(resultados.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(renovar).toHaveBeenCalledTimes(1);
  });

  it('si no se puede renovar, cierra la sesión', async () => {
    guardarSesion('token-vencido');
    httpClient.defaults.adapter = servidor('nunca');
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('refresh vencido'));

    await expect(httpClient.get('/lf-itse/expedientes/')).rejects.toThrow('refresh vencido');
    expect(localStorage.getItem('auth-storage')).toBeNull();
    expect(localStorage.getItem('auth-refresh-token')).toBeNull();
  });

  it('sin refresh token, cierra la sesión sin intentar renovar', async () => {
    guardarSesion('token-vencido', null);
    httpClient.defaults.adapter = servidor('nunca');
    const renovar = vi.spyOn(axios, 'post');

    await expect(httpClient.get('/lf-itse/expedientes/')).rejects.toBeInstanceOf(AxiosError);
    expect(renovar).not.toHaveBeenCalled();
    expect(localStorage.getItem('auth-storage')).toBeNull();
  });

  it('una contraseña incorrecta no intenta renovar la sesión', async () => {
    httpClient.defaults.adapter = servidor('nunca');
    const renovar = vi.spyOn(axios, 'post');

    await expect(httpClient.post('/auth/jwt/create/', { username: 'x', password: 'y' })).rejects.toBeInstanceOf(AxiosError);
    expect(renovar).not.toHaveBeenCalled();
  });

  it('una contraseña incorrecta del ciudadano no cierra ni redirige nada', async () => {
    guardarSesion('token-del-personal');
    httpClient.defaults.adapter = servidor('nunca');
    const renovar = vi.spyOn(axios, 'post');

    await expect(httpClient.post('/publico/cuenta/ingresar/', { documento: '12345678', clave: 'x' })).rejects.toMatchObject({ response: { status: 401 } });
    expect(renovar).not.toHaveBeenCalled();
    expect(tokenGuardado()).toBe('token-del-personal');
  });

  it('los demás errores llegan tal cual a la pantalla', async () => {
    guardarSesion('token-1');
    httpClient.defaults.adapter = vi.fn<AxiosAdapter>(async (config) => respuesta(config, 422, { error: 'Dato inválido' }));

    await expect(httpClient.post('/lf-itse/expedientes/', {})).rejects.toMatchObject({ response: { status: 422, data: { error: 'Dato inválido' } } });
    expect(tokenGuardado()).toBe('token-1');
  });
});
