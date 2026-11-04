import { describe, expect, it } from 'vitest';
import { cumpleContrasena, MENSAJE_CONTRASENA } from './contrasena';

describe('contrasena', () => {
  it('exige al menos 10 caracteres', () => {
    expect(cumpleContrasena('123456789')).toBe(false);
    expect(cumpleContrasena('1234567890')).toBe(true);
  });

  it('no cuenta los espacios de los extremos, igual que el backend', () => {
    expect(cumpleContrasena('          ')).toBe(false);
    expect(cumpleContrasena('  12345678  ')).toBe(false);
  });

  it('anuncia el mismo mínimo que valida', () => {
    expect(MENSAJE_CONTRASENA).toBe('La contraseña debe tener al menos 10 caracteres.');
  });
});
