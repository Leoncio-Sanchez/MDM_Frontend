/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/entities/Usuarios.entity.ts
 */

export interface UsuarioPerfil {
  expedientes: boolean;
  licencias: boolean;
  itse: boolean;
  admin: boolean;
}

export interface Usuarios {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  nombre_completo?: string;
  email?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser?: boolean;
  date_joined?: string | null;
  last_login?: string | null;
  perfil?: UsuarioPerfil | null;
  password?: string;
}
