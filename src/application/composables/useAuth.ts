import { useQuery, useMutation } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';

const KEY = ['auth', 'me'] as const;

export function useLogin() {
  const authStore = useAuthStore();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => container.auth.login(credentials),
    onSuccess: (data) => {
      authStore.setUser(data.user, data.token);
    },
  });
}

export function useLogout() {
  const authStore = useAuthStore();
  
  return useMutation({
    mutationFn: () => container.auth.logout(),
    onSuccess: () => {
      authStore.clearUser();
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => container.auth.getCurrentUser(),
  });
}
