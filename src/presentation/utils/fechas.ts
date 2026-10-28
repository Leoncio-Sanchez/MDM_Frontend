/**
 * Fechas "YYYY-MM-DD" en hora local. Se evita `new Date('2026-01-15')`, que la interpreta
 * en UTC y en Perú (UTC-5) la muestra un día antes.
 */

const aISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const desdeISO = (fechaISO: string) => {
  const [y, m, d] = fechaISO.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const hoyISO = () => aISO(new Date());

export const sumarDias = (fechaISO: string, dias: number) => {
  const fecha = desdeISO(fechaISO);
  fecha.setDate(fecha.getDate() + dias);
  return aISO(fecha);
};

/** Días desde hoy hasta la fecha (negativo si ya pasó). */
export const diasHasta = (fechaISO: string) =>
  Math.round((desdeISO(fechaISO).getTime() - desdeISO(hoyISO()).getTime()) / 86_400_000);

/** "2026-01-15" → "15/01/2026" */
export const formatoFecha = (fechaISO?: string | null) => (fechaISO ? fechaISO.slice(0, 10).split('-').reverse().join('/') : '—');
