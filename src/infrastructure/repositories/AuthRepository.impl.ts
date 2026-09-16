/**
 * @source golden-source
 * @origin reconstructed-frontend/src/infrastructure/repositories/AuthRepository.impl.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

import type { AuthRepositoryPort } from '../../domain/ports/AuthRepository.port';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';
import type { User } from '../../domain/entities/User.entity';
import { httpClient } from '../http/axios.client';

export class AuthRepositoryImpl implements AuthRepositoryPort {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const { data } = await httpClient.post('/auth/jwt/create/', credentials);
    // Decode user info from the backend response or token (we sent username in backend)
    // The backend actually sends: { access: token, refresh: token, role: user.role }
    // To make it fully complete, we can parse the JWT payload
    const token = data.access;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);

    return { 
      user: { 
        id: payload.id, 
        username: payload.username, 
        role: payload.role, 
        ruc: payload.ruc 
      }, 
      token: token 
    };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth-storage');
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }
}
