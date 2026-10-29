import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { AxiosError } from 'axios';
import CiudadanoAccesoPage from './CiudadanoAccesoPage.vue';

const push = vi.fn();
const acciones = {
  ingresar: { mutate: vi.fn(), isPending: ref(false) },
  registrar: { mutate: vi.fn(), isPending: ref(false) },
  restablecer: { mutate: vi.fn(), isPending: ref(false) },
};

vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }));
vi.mock('../../application/composables/useConsultaPublica', () => ({ useAccesoCiudadano: () => acciones }));

const montar = () => mount(CiudadanoAccesoPage, { global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } } });

const llenar = async (pagina: ReturnType<typeof montar>, campos: Record<string, string>) => {
  for (const [id, valor] of Object.entries(campos)) await pagina.find(`#${id}`).setValue(valor);
};
const enviar = async (pagina: ReturnType<typeof montar>) => {
  await pagina.find('form').trigger('submit');
  await flushPromises();
};

const error = (status: number, data: unknown) =>
  new AxiosError('error', String(status), undefined, null, { status, data, statusText: '', headers: {}, config: {} as never });

beforeEach(() => {
  push.mockReset();
  Object.values(acciones).forEach((a) => a.mutate.mockReset());
});

describe('acceso del ciudadano', () => {
  it('ingresa con su DNI y contraseña y va a "Mis trámites"', async () => {
    acciones.ingresar.mutate.mockImplementation((_datos, { onSuccess }) => onSuccess());
    const pagina = montar();
    await llenar(pagina, { 'ciu-documento': ' 12345678 ', 'ciu-clave': 'Bodega2026' });
    await enviar(pagina);

    expect(acciones.ingresar.mutate).toHaveBeenCalledWith({ documento: '12345678', clave: 'Bodega2026' }, expect.anything());
    expect(push).toHaveBeenCalledWith('/ciudadano');
    // Ingresar no pide el expediente
    expect(pagina.find('#ciu-expediente').exists()).toBe(false);
  });

  it('al crear la cuenta pide un expediente suyo y una contraseña con letras y números', async () => {
    const pagina = montar();
    await pagina.findAll('[role="tab"]')[1].trigger('click');
    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-expediente': 'abc', 'ciu-clave': 'solotexto', 'ciu-confirmacion': 'otra' });
    await enviar(pagina);

    expect(pagina.text()).toContain('Ingrese el número de uno de sus expedientes');
    expect(pagina.text()).toContain('La contraseña debe tener letras y números.');
    expect(pagina.text()).toContain('Las contraseñas no coinciden.');
    expect(acciones.registrar.mutate).not.toHaveBeenCalled();
  });

  it('envía el registro con la prueba del expediente', async () => {
    const pagina = montar();
    await pagina.findAll('[role="tab"]')[1].trigger('click');
    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-expediente': '1250', 'ciu-clave': 'Bodega2026', 'ciu-confirmacion': 'Bodega2026' });
    await enviar(pagina);

    expect(acciones.registrar.mutate).toHaveBeenCalledWith(
      { documento: '12345678', numero_expediente: 1250, clave: 'Bodega2026', clave_confirmation: 'Bodega2026' },
      expect.anything(),
    );
  });

  it('la contraseña no puede ser el propio documento', async () => {
    const pagina = montar();
    await pagina.findAll('[role="tab"]')[1].trigger('click');
    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-expediente': '1250', 'ciu-clave': '12345678', 'ciu-confirmacion': '12345678' });
    await enviar(pagina);

    expect(pagina.text()).toContain('debe tener letras y números');
    expect(acciones.registrar.mutate).not.toHaveBeenCalled();
  });

  it('muestra el motivo del servidor sin salir de la pantalla', async () => {
    acciones.registrar.mutate.mockImplementation((_datos, { onError }) =>
      onError(error(422, { error: 'El número de expediente no corresponde a ese DNI o RUC.' })),
    );
    const pagina = montar();
    await pagina.findAll('[role="tab"]')[1].trigger('click');
    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-expediente': '1251', 'ciu-clave': 'Bodega2026', 'ciu-confirmacion': 'Bodega2026' });
    await enviar(pagina);

    expect(pagina.find('[role="alert"]').text()).toContain('no corresponde a ese DNI o RUC');
    expect(push).not.toHaveBeenCalled();
  });

  it('una contraseña incorrecta se informa en el formulario', async () => {
    acciones.ingresar.mutate.mockImplementation((_datos, { onError }) => onError(error(401, { detail: 'DNI/RUC o contraseña incorrectos.' })));
    const pagina = montar();
    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-clave': 'Equivocada1' });
    await enviar(pagina);

    expect(pagina.find('[role="alert"]').text()).toContain('DNI/RUC o contraseña incorrectos.');
  });

  it('"Olvidé mi contraseña" pide la misma prueba que el registro', async () => {
    const pagina = montar();
    await pagina.findAll('button').find((b) => b.text() === 'Olvidé mi contraseña')!.trigger('click');
    expect(pagina.text()).toContain('Restablezca su contraseña');

    await llenar(pagina, { 'ciu-documento': '12345678', 'ciu-expediente': '1250', 'ciu-clave': 'Nueva2027', 'ciu-confirmacion': 'Nueva2027' });
    await enviar(pagina);
    expect(acciones.restablecer.mutate).toHaveBeenCalledWith(expect.objectContaining({ numero_expediente: 1250, clave: 'Nueva2027' }), expect.anything());
  });
});
