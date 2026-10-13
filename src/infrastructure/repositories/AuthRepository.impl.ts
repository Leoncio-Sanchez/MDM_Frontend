import type { AuthRepositoryPort } from '../../domain/ports/AuthRepository.port';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';
import type { User } from '../../domain/entities/User.entity';
import { httpClient } from '../http/axios.client';

/** Respuesta de GET /auth/users/me/ */
interface UsuarioActualDTO {
  id: number;
  username: string;
  email: string;
  role: User['role'];
  permisos: NonNullable<User['permisos']>;
}

const aUsuario = (dto: UsuarioActualDTO): User => ({
  id: dto.id,
  username: dto.username,
  email: dto.email,
  role: dto.role,
  permisos: dto.permisos,
});

export class AuthRepositoryImpl implements AuthRepositoryPort {
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const { data } = await httpClient.post('/auth/jwt/create/', credentials);
    const token: string = data.access;

    if (data.refresh) {
      localStorage.setItem('auth-refresh-token', data.refresh);
    }

    // El token aún no está guardado en el store: se envía explícitamente
    const { data: me } = await httpClient.get<UsuarioActualDTO>('/auth/users/me/', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return { user: aUsuario(me), token };
  }

  async logout(): Promise<void> {
    localStorage.removeItem('auth-storage');
    localStorage.removeItem('auth-refresh-token');
  }

  async getCurrentUser(): Promise<User | null> {
    const { data } = await httpClient.get<UsuarioActualDTO>('/auth/users/me/');
    return aUsuario(data);
  }
}
