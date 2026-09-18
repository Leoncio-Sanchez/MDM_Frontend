import type { AuthRepositoryPort } from '../../domain/ports/AuthRepository.port';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';
import type { User } from '../../domain/entities/User.entity';

export class LoginUseCase {
  authRepository: AuthRepositoryPort;
  
  constructor(authRepository: AuthRepositoryPort) {
    this.authRepository = authRepository;
  }

  async execute(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    if (!credentials.username || !credentials.password) {
      throw new Error('Credenciales inválidas');
    }
    return this.authRepository.login(credentials);
  }
}
