/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/AuthRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { User } from '../entities/User.entity';
import type { LoginCredentials } from '../entities/LoginCredentials.entity';
import type { DatosCuentaCiudadano } from '../entities/ConsultaPublica.entity';

export interface AuthRepositoryPort {
  login(credentials: LoginCredentials): Promise<{ user: User; token: string }>;
  /** Ciudadanos: entran con su DNI/RUC; crear la cuenta y restablecer la contraseña dejan la sesión iniciada */
  ingresarCiudadano(documento: string, clave: string): Promise<{ user: User; token: string }>;
  registrarCiudadano(datos: DatosCuentaCiudadano): Promise<{ user: User; token: string }>;
  restablecerClaveCiudadano(datos: DatosCuentaCiudadano): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
