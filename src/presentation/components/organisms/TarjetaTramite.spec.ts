import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import TarjetaTramite from './TarjetaTramite.vue';
import type { AvanceInspeccion, TramitePublico } from '../../../domain/entities/ConsultaPublica.entity';

const expediente = (inspeccion: AvanceInspeccion | null = null): TramitePublico => ({
  tipo: 'expediente',
  numero: 1250,
  estado: 'EN TRÁMITE',
  nombre_comercial: null,
  procedimiento: 'LICENCIA CON ITSE',
  giros: [],
  fecha_emision: '2026-10-20',
  fecha_vencimiento: '2026-11-10',
  vigencia_indeterminada: false,
  inspeccion,
});

const aviso = (inspeccion: AvanceInspeccion | null) => mount(TarjetaTramite, { props: { tramite: expediente(inspeccion) } }).find('[role="note"]');

describe('tarjeta de trámite del ciudadano', () => {
  it('muestra el expediente con sus fechas sin pasar por la zona horaria', () => {
    const tarjeta = mount(TarjetaTramite, { props: { tramite: expediente() } });
    expect(tarjeta.text()).toContain('Expediente N.° 1250');
    expect(tarjeta.text()).toContain('20/10/2026');
    expect(tarjeta.text()).toContain('10/11/2026');
    expect(tarjeta.find('[role="note"]').exists()).toBe(false);
  });

  it('avisa la fecha de la visita de inspección', () => {
    expect(aviso({ estado: 'PROGRAMADA', fecha: '2026-11-05' }).text()).toContain('programada para el 05/11/2026');
    expect(aviso({ estado: 'POR_PROGRAMAR', fecha: null }).text()).toContain('el inspector coordinará con usted');
    expect(aviso({ estado: 'POR_ASIGNAR', fecha: null }).text()).toContain('programará la visita');
  });

  it('destaca el plazo para subsanar lo observado', () => {
    const nota = aviso({ estado: 'OBSERVADA', fecha: '2026-11-03' });
    expect(nota.text()).toContain('Corríjalas hasta el 03/11/2026');
    expect(nota.classes()).toContain('bg-amber-50');
  });

  it('informa el resultado final de la inspección', () => {
    expect(aviso({ estado: 'APROBADA', fecha: null }).text()).toContain('está emitiendo su certificado');
    expect(aviso({ estado: 'DESAPROBADA', fecha: null }).text()).toContain('no fue aprobada');
  });

  it('una licencia muestra vigencia y giros', () => {
    const tarjeta = mount(TarjetaTramite, {
      props: {
        tramite: { ...expediente(), tipo: 'licencia', estado: 'VIGENTE', nombre_comercial: 'BODEGA LUCHITO', procedimiento: null, giros: ['ABARROTES'], vigencia_indeterminada: true },
      },
    });
    expect(tarjeta.text()).toContain('Licencia de Funcionamiento N.° 1250');
    expect(tarjeta.text()).toContain('Vigencia indeterminada');
    expect(tarjeta.text()).toContain('ABARROTES');
  });

  it('sigue el modo oscuro solo en "Mis trámites"; la consulta pública es siempre clara', () => {
    const nota = { estado: 'PROGRAMADA', fecha: '2026-11-05' } as const;
    const publica = mount(TarjetaTramite, { props: { tramite: expediente(nota) } });
    const misTramites = mount(TarjetaTramite, { props: { tramite: expediente(nota), sigueTema: true } });

    expect(publica.html()).not.toContain('dark:');
    expect(misTramites.find('article').classes()).toContain('dark:bg-[#18181b]');
    expect(misTramites.find('[role="note"]').classes()).toContain('dark:bg-sky-950/40');
  });
});
