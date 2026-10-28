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

export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Mes completo: 0 = este mes, -1 = el anterior… */
export const rangoMes = (desplazamiento = 0): RangoFechas => {
  const hoy = new Date();
  return {
    desde: aISO(new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento, 1)),
    hasta: aISO(new Date(hoy.getFullYear(), hoy.getMonth() + desplazamiento + 1, 0)),
  };
};

/** Del 1 de enero al 31 de diciembre del año en curso */
export const rangoAnio = (): RangoFechas => {
  const anio = new Date().getFullYear();
  return { desde: `${anio}-01-01`, hasta: `${anio}-12-31` };
};

/** Del primer al último día de un mismo mes */
export const esMesCompleto = ({ desde, hasta }: RangoFechas) => {
  const inicio = desdeISO(desde);
  return inicio.getDate() === 1 && hasta === aISO(new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0));
};

/** "setiembre de 2026" si es un mes completo; si no, "01/09/2026 al 15/09/2026" */
export const nombrePeriodo = (rango: RangoFechas) =>
  esMesCompleto(rango)
    ? new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric' }).format(desdeISO(rango.desde))
    : `${formatoFecha(rango.desde)} al ${formatoFecha(rango.hasta)}`;

/** "2026-01-15" → "15/01/2026" */
export const formatoFecha = (fechaISO?: string | null) => (fechaISO ? fechaISO.slice(0, 10).split('-').reverse().join('/') : '—');
