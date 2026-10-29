import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { AxiosError } from 'axios';
import DenegatoriaModal from './DenegatoriaModal.vue';

const mutateAsync = vi.fn();
const confirmar = vi.fn();
const exito = vi.fn();

vi.mock('../../../application/composables/useExpedientes', () => ({
  useDenegarAutorizacion: () => ({ mutateAsync, isPending: ref(false) }),
}));
vi.mock('../../../infrastructure/store/useNotificationStore', async (original) => ({
  ...(await original<typeof import('../../../infrastructure/store/useNotificationStore')>()),
  useDialog: () => ({ confirm: confirmar }),
  useToast: () => ({ success: exito }),
}));

const montar = (props: Record<string, unknown> = {}) =>
  mount(DenegatoriaModal, {
    props: { expediente: { id: 26, numero: 990002 }, tipos: ['ITSE'], ...props },
    global: { stubs: { teleport: true } },
  });

const registrar = async (wrapper: ReturnType<typeof montar>) => {
  await wrapper.find('form').trigger('submit');
  await flushPromises();
};

const errorDelServidor = (status: number, data: unknown) =>
  new AxiosError('error', String(status), undefined, null, { status, data, statusText: '', headers: {}, config: {} as never });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-29T15:00:00-05:00'));
  mutateAsync.mockReset().mockResolvedValue({});
  confirmar.mockReset().mockResolvedValue(true);
  exito.mockReset();
});
afterEach(() => vi.useRealTimers());

describe('denegatoria', () => {
  it('propone la fecha de hoy y el motivo sugerido', () => {
    const wrapper = montar({ observacionesSugeridas: 'Reinspección desaprobada según acta N° 12' });
    expect((wrapper.find('#deneg-fecha').element as HTMLInputElement).value).toBe('2026-10-29');
    expect((wrapper.find('#deneg-observaciones').element as HTMLTextAreaElement).value).toBe('Reinspección desaprobada según acta N° 12');
  });

  it('pide la resolución y un motivo explicado, sin enviar nada', async () => {
    const wrapper = montar();
    await wrapper.find('#deneg-observaciones').setValue('corto');
    await registrar(wrapper);

    expect(wrapper.text()).toContain('Indique la resolución que sustenta la denegatoria.');
    expect(wrapper.text()).toContain('Explique el motivo (al menos 10 caracteres).');
    expect(confirmar).not.toHaveBeenCalled();
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('no acepta una fecha futura', async () => {
    const wrapper = montar({ observacionesSugeridas: 'Motivo suficientemente largo' });
    await wrapper.find('#deneg-documento').setValue('RES. 045-2026');
    await wrapper.find('#deneg-fecha').setValue('2026-10-30');
    await registrar(wrapper);

    expect(wrapper.text()).toContain('La fecha no puede ser posterior a hoy.');
    expect(mutateAsync).not.toHaveBeenCalled();
  });

  it('confirma antes de registrar y envía los datos limpios', async () => {
    const wrapper = montar({ observacionesSugeridas: '  No se subsanaron las observaciones  ' });
    await wrapper.find('#deneg-documento').setValue('  RES. 045-2026  ');
    await registrar(wrapper);

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Denegar la ITSE?' }));
    expect(mutateAsync).toHaveBeenCalledWith({
      id: 26,
      tipo: 'ITSE',
      datos: { fecha_rechazo: '2026-10-29', documento: 'RES. 045-2026', observaciones: 'No se subsanaron las observaciones' },
    });
    expect(exito).toHaveBeenCalled();
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('si no se confirma, no registra', async () => {
    confirmar.mockResolvedValue(false);
    const wrapper = montar({ observacionesSugeridas: 'No se subsanaron las observaciones' });
    await wrapper.find('#deneg-documento').setValue('RES. 045-2026');
    await registrar(wrapper);

    expect(mutateAsync).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('con licencia e ITSE pendientes, deja elegir qué se deniega', async () => {
    const wrapper = montar({ tipos: ['ITSE', 'LF'], observacionesSugeridas: 'Zonificación no compatible con el giro' });
    await wrapper.find('input[value="LF"]').setValue(true);
    await wrapper.find('#deneg-documento').setValue('RES. 046-2026');
    await registrar(wrapper);

    expect(confirmar).toHaveBeenCalledWith(expect.objectContaining({ title: '¿Denegar la licencia de funcionamiento?' }));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'LF' }));
  });

  it('muestra los errores del servidor junto al campo o arriba', async () => {
    const wrapper = montar({ observacionesSugeridas: 'No se subsanaron las observaciones' });
    await wrapper.find('#deneg-documento').setValue('RES. 045-2026');

    mutateAsync.mockRejectedValueOnce(errorDelServidor(400, { fecha_rechazo: ['La fecha no es válida.'] }));
    await registrar(wrapper);
    expect(wrapper.text()).toContain('La fecha no es válida.');

    mutateAsync.mockRejectedValueOnce(errorDelServidor(422, { error: 'El expediente N° 990002 ya tiene registrada la denegatoria de la ITSE.' }));
    await registrar(wrapper);
    expect(wrapper.find('[role="alert"]').text()).toContain('ya tiene registrada la denegatoria');
    expect(wrapper.emitted('close')).toBeUndefined();
  });
});
