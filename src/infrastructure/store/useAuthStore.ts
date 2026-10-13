import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { container } from '../../composition/container';
import type { Permiso, User } from '../../domain/entities/User.entity';
import type { LoginCredentials } from '../../domain/entities/LoginCredentials.entity';

export const useAuthStore = defineStore('auth', () => {
  // State (refs)
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters (computed)
  const isAuthenticated = computed(() => user.value !== null && token.value !== null);

  /** ¿Tiene alguno de los accesos indicados? Sin lista, no exige ninguno. */
  function puede(permisos?: Permiso[]): boolean {
    if (!permisos || permisos.length === 0) return true;
    return permisos.some((p) => user.value?.permisos?.[p] === true);
  }

  // Actions
  function setUser(newUser: User, newToken: string) {
    user.value = newUser;
    token.value = newToken;
  }

  function clearUser() {
    user.value = null;
    token.value = null;
    error.value = null;
  }

  async function login(credentials: LoginCredentials) {
    isLoading.value = true;
    error.value = null;
    try {
      const { user: u, token: t } = await container.auth.login(credentials);
      setUser(u, t);
    } catch (e) {
      error.value = (e as Error).message;
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /** Vuelve a leer rol y accesos del servidor (p. ej. si un administrador los cambió). */
  async function refrescarUsuario() {
    if (!token.value) return;
    const actual = await container.auth.getCurrentUser();
    if (actual) user.value = actual;
  }

  async function logout() {
    try {
      await container.auth.logout();
    } finally {
      clearUser();
    }
  }

  return {
    // State
    user,
    token,
    isLoading,
    error,
    // Getters
    isAuthenticated,
    puede,
    // Actions
    setUser,
    clearUser,
    login,
    refrescarUsuario,
    logout,
  };
}, {
  persist: {
    key: 'auth-storage',
    storage: localStorage,
  },
});
