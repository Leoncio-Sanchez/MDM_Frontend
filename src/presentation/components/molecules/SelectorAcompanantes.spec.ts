import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import SelectorAcompanantes from './SelectorAcompanantes.vue';
import type { InspectorDisponible } from '../../../domain/entities/Inspecciones.entity';

const inspector = (id: number, nombre: string): InspectorDisponible => ({ id, username: `u${id}`, nombre, pendientes: 1, acompanando: 0 });
const INSPECTORES = [inspector(1, 'CARLOS'), inspector(2, 'MARIA'), inspector(3, 'JOSE'), inspector(4, 'ROSA'), inspector(5, 'LUIS')];

const montar = (props: Partial<InstanceType<typeof SelectorAcompanantes>['$props']> = {}) =>
  mount(SelectorAcompanantes, {
    props: {
      inspectores: INSPECTORES,
      responsableId: 1,
      modelValue: [],
      idBase: 'prueba',
      'onUpdate:modelValue': (valor: number[]) => wrapper.setProps({ modelValue: valor }),
      ...props,
    },
  });
let wrapper: ReturnType<typeof montar>;

const opciones = () => wrapper.findAll('label').map((l) => l.find('span span').text());
const casilla = (nombre: string) => wrapper.findAll('label').find((l) => l.text().includes(nombre))!.find('input');

describe('selector de acompañantes', () => {
  it('no ofrece al responsable como acompañante', () => {
    wrapper = montar();
    expect(opciones()).toEqual(['MARIA', 'JOSE', 'ROSA', 'LUIS']);
  });

  it('marca y desmarca acompañantes', async () => {
    wrapper = montar();
    await casilla('MARIA').setValue(true);
    await casilla('JOSE').setValue(true);
    expect(wrapper.props('modelValue')).toEqual([2, 3]);

    await casilla('MARIA').setValue(false);
    expect(wrapper.props('modelValue')).toEqual([3]);
  });

  it('con 3 acompañantes, bloquea el resto', async () => {
    wrapper = montar({ modelValue: [2, 3, 4] });
    expect(casilla('LUIS').attributes('disabled')).toBeDefined();
    expect(casilla('MARIA').attributes('disabled')).toBeUndefined();
  });

  it('si el responsable estaba marcado como acompañante, no cuenta para el límite', () => {
    // Al cambiar de responsable en el formulario puede quedar marcado: no se envía ni bloquea
    wrapper = montar({ modelValue: [1, 2, 3] });
    expect(casilla('ROSA').attributes('disabled')).toBeUndefined();
  });

  it('muestra al acompañante desactivado para poder quitarlo del equipo', () => {
    wrapper = montar({
      inspectores: INSPECTORES.filter((i) => i.id !== 9),
      modelValue: [9],
      actuales: [{ id: 9, nombre: 'PEDRO', activo: false }],
    });
    expect(opciones()).toContain('PEDRO');
    expect(wrapper.text()).toContain('desactivado: quítelo del equipo');
    expect(casilla('PEDRO').element.checked).toBe(true);
  });
});
