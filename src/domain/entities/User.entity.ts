/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/entities/User.entity.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

export interface User {
  id: string | number;
  username: string;
  role: 'ADMIN_MUNICIPALIDAD' | 'CIUDADANO' | 'EMPRESA' | 'INSPECTOR' | 'ESPECIALISTA';
  email?: string;
  isActive?: boolean;
  ruc?: string;
}
