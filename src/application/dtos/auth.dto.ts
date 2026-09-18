export interface LoginRequestDTO {
  username: string;
  password?: string;
}

export interface LoginResponseDTO {
  token: string;
  user: {
    id: number | string;
    username: string;
    role: string;
    email?: string;
  };
}
