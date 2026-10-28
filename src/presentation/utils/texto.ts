/** Minúsculas y sin tildes, para comparar textos: "JOSÉ Peña" → "jose pena". */
export const normalizar = (texto: unknown) =>
  String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * ¿El texto contiene todas las palabras buscadas, en cualquier orden?
 * Sin importar mayúsculas ni tildes: "bodega jose" encuentra "JOSÉ - BODEGA EL SOL".
 */
export const coincide = (texto: unknown, busqueda: string) => {
  const contenido = normalizar(texto);
  return normalizar(busqueda)
    .split(/\s+/)
    .filter(Boolean)
    .every((palabra) => contenido.includes(palabra));
};
