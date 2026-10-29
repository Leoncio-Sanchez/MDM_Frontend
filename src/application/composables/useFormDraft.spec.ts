import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { useFormDraft } from './useFormDraft';

/**
 * Borradores de formularios: lo que se escribe al crear un registro se guarda en el navegador
 * para no perderlo si se cierra el modal o se recarga la página.
 */

const INICIAL = { numero: '', observaciones: '' };
const CLAVE = 'muni_draft_prueba';

const montar = () => {
  let api!: ReturnType<typeof useFormDraft<typeof INICIAL>>;
  mount(
    defineComponent({
      setup() {
        api = useFormDraft({ key: 'prueba', initialData: INICIAL, debounceMs: 300 });
        return () => null;
      },
    }),
  );
  return api;
};

const escribir = async (api: ReturnType<typeof montar>, cambios: Partial<typeof INICIAL>) => {
  Object.assign(api.form.value, cambios);
  await nextTick();
  vi.advanceTimersByTime(300);
};

const guardado = () => JSON.parse(localStorage.getItem(CLAVE) ?? 'null')?.data ?? null;

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('borradores de formularios', () => {
  it('guarda lo que se escribe y lo recupera al volver', async () => {
    const api = montar();
    await escribir(api, { numero: '123' });

    expect(guardado()).toEqual({ numero: '123', observaciones: '' });
    expect(api.hasDraft.value).toBe(true);

    const otraVez = montar();
    expect(otraVez.form.value.numero).toBe('123');
    expect(otraVez.hasDraft.value).toBe(true);
  });

  it('espera a que se deje de escribir antes de guardar', async () => {
    const api = montar();
    Object.assign(api.form.value, { numero: '1' });
    await nextTick();
    vi.advanceTimersByTime(100);
    expect(guardado()).toBeNull();

    vi.advanceTimersByTime(200);
    expect(guardado()?.numero).toBe('1');
  });

  it('al descartar o guardar, el siguiente formulario se abre vacío', async () => {
    const api = montar();
    await escribir(api, { numero: '123' });

    api.clearDraft();
    await nextTick();
    vi.advanceTimersByTime(300);

    expect(localStorage.getItem(CLAVE)).toBeNull();
    expect(api.form.value).toEqual(INICIAL);
    expect(montar().form.value).toEqual(INICIAL);
  });

  it('editar un registro existente no deja borrador para el próximo "Nuevo"', async () => {
    const api = montar();
    api.setFormData({ numero: '555', observaciones: 'registro existente' });
    await nextTick();
    vi.advanceTimersByTime(300);
    expect(localStorage.getItem(CLAVE)).toBeNull();

    // El usuario cambia algo del registro y cierra sin guardar
    await escribir(api, { observaciones: 'cambio a medias' });

    // Luego pulsa "Nuevo": no debe aparecer el expediente 555
    expect(api.loadDraft()).toBe(false);
    expect(localStorage.getItem(CLAVE)).toBeNull();
  });

  it('ignora un borrador dañado', () => {
    localStorage.setItem(CLAVE, '{no es json');
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const api = montar();
    expect(api.form.value).toEqual(INICIAL);
    expect(api.hasDraft.value).toBe(false);
  });
});
