/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/entities/User.entity.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

/**
 * Accesos del perfil operativo (usuarios_perfiles).
 * inspector: inspector de campo · jefe_itse: asigna inspectores · reportes: solo lectura de reportes
 */
export type Permiso = 'expedientes' | 'licencias' | 'itse' | 'admin' | 'inspector' | 'jefe_itse' | 'reportes';
export type Permisos = Record<Permiso, boolean>;

export interface User {
  id: string | number;
  username: string;
  role: 'ADMIN_MUNICIPALIDAD' | 'CIUDADANO' | 'EMPRESA' | 'INSPECTOR' | 'ESPECIALISTA';
  email?: string;
  isActive?: boolean;
  ruc?: string;
  permisos?: Permisos;
}
