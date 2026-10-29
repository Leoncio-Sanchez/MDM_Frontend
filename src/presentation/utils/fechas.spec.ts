import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { diasHasta, esMesCompleto, formatoFecha, hoyISO, nombrePeriodo, rangoAnio, rangoMes, sumarDias } from './fechas';

describe('fechas en hora de Perú', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 29/10/2026 a las 21:30 en Lima: en UTC ya es el 30, el caso que antes salía un día corrido
    vi.setSystemTime(new Date('2026-10-30T02:30:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('hoy es la fecha local, no la de UTC', () => {
    expect(hoyISO()).toBe('2026-10-29');
  });

  it('cuenta los días que faltan o pasaron', () => {
    expect(diasHasta('2026-10-29')).toBe(0);
    expect(diasHasta('2026-11-05')).toBe(7);
    expect(diasHasta('2026-10-28')).toBe(-1);
    // Acepta fechas con hora (las que llegan del servidor)
    expect(diasHasta('2026-10-30T00:00:00-05:00')).toBe(1);
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-10-29', 3)).toBe('2026-11-01');
    expect(sumarDias('2026-12-30', 2)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('arma rangos de mes y de año', () => {
    expect(rangoMes()).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' });
    expect(rangoMes(-1)).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
    expect(rangoMes(4)).toEqual({ desde: '2027-02-01', hasta: '2027-02-28' });
    expect(rangoAnio()).toEqual({ desde: '2026-01-01', hasta: '2026-12-31' });
  });

  it('nombra el periodo de un reporte', () => {
    expect(esMesCompleto({ desde: '2026-09-01', hasta: '2026-09-30' })).toBe(true);
    expect(esMesCompleto({ desde: '2026-09-01', hasta: '2026-09-29' })).toBe(false);
    expect(nombrePeriodo({ desde: '2026-09-01', hasta: '2026-09-30' })).toBe('setiembre de 2026');
    expect(nombrePeriodo({ desde: '2026-09-01', hasta: '2026-09-15' })).toBe('01/09/2026 al 15/09/2026');
  });

  it('muestra las fechas como dd/mm/aaaa', () => {
    expect(formatoFecha('2026-01-15')).toBe('15/01/2026');
    expect(formatoFecha('2026-01-15T00:00:00-05:00')).toBe('15/01/2026');
    expect(formatoFecha(null)).toBe('—');
    expect(formatoFecha('')).toBe('—');
  });
});
