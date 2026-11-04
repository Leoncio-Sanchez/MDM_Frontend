/** Mismo mínimo que el backend (ReglaContrasena) para el personal y los inspectores. */
export const CONTRASENA_MINIMA = 10;

export const MENSAJE_CONTRASENA = `La contraseña debe tener al menos ${CONTRASENA_MINIMA} caracteres.`;

export const cumpleContrasena = (clave: string) => clave.trim().length >= CONTRASENA_MINIMA;
