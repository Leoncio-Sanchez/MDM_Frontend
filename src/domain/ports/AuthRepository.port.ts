/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/AuthRepository.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { User } from '../entities/User.entity';
import type { LoginCredentials } from '../entities/LoginCredentials.entity';

export interface AuthRepositoryPort {
  login(credentials: LoginCredentials): Promise<{ user: User; token: string }>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
}
