/** Una columna del archivo: título y cómo obtener el valor de cada fila. */
export interface ColumnaCsv<T> {
  titulo: string;
  valor: (fila: T) => string | number | boolean | null | undefined;
}

/**
 * Celda segura para Excel:
 * - entre comillas, con las comillas internas duplicadas (las comas y saltos no rompen columnas);
 * - un texto que empieza con = + - @ se antepone con ' para que Excel no lo ejecute como fórmula.
 */
const celda = (valor: unknown) => {
  let texto = valor === null || valor === undefined ? '' : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
};

/**
 * Descarga las filas como CSV que Excel abre bien:
 * con BOM UTF-8 (para que las tildes y la ñ no salgan dañadas) y separador ";" (Excel en español).
 */
export function descargarCsv<T>(nombreArchivo: string, columnas: ColumnaCsv<T>[], filas: T[]) {
  const lineas = [
    columnas.map((c) => celda(c.titulo)).join(';'),
    ...filas.map((f) => columnas.map((c) => celda(c.valor(f))).join(';')),
  ];
  const blob = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo.endsWith('.csv') ? nombreArchivo : `${nombreArchivo}.csv`;
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
