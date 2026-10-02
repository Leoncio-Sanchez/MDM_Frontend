import type { AuthRepositoryPort } from '../../domain/ports/AuthRepository.port';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';
import type { User } from '../../domain/entities/User.entity';
import { httpClient } from '../http/axios.client';

export class AuthRepositoryImpl implements AuthRepositoryPort {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const { data } = await httpClient.post('/auth/jwt/create/', credentials);
    
    const token = data.access;
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);

    const username = payload.username ?? payload.sub ?? 'unknown';
    const role = payload.role ?? 'unknown';

    if (data.refresh) {
      localStorage.setItem('auth-refresh-token', data.refresh);
    }

    return { 
      user: { 
        id: payload.id ?? payload.user_id, 
        username: username, 
        role: role, 
        ruc: payload.ruc ?? null 
      }, 
      token: token 
    };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('auth-refresh-token');
  }

  async getCurrentUser(): Promise<User | null> {
    return null;
  }
}
