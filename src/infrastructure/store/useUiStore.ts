import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const getInitialCollapsed = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('muni_sidebar_collapsed') === 'true';
  };

  const getInitialTheme = (): boolean => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('muni_theme');
    if (stored) {
      return stored === 'dark';
    }
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
  };

  const isSidebarCollapsed = ref<boolean>(getInitialCollapsed());
  const isMobileSidebarOpen = ref<boolean>(false);
  const isDarkMode = ref<boolean>(getInitialTheme());

  const applyTheme = (dark: boolean) => {
    if (typeof document !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  // Inicializar estado del tema en DOM inmediatamente
  applyTheme(isDarkMode.value);

  watch(isSidebarCollapsed, (val) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('muni_sidebar_collapsed', String(val));
    }
  });

  watch(isDarkMode, (val) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('muni_theme', val ? 'dark' : 'light');
      applyTheme(val);
    }
  });

  function toggleSidebar() {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
    } else {
      isSidebarCollapsed.value = !isSidebarCollapsed.value;
    }
  }

  function closeMobileSidebar() {
    isMobileSidebarOpen.value = false;
  }

  function toggleTheme() {
    isDarkMode.value = !isDarkMode.value;
  }

  // ── Loader de pantalla completa (arranque de la app e ingreso tras el login) ──
  // Visible desde el primer render: cubre la carga inicial hasta que el router resuelve la ruta.
  const isAppLoading = ref(true);
  const MIN_LOADER_MS = 600; // evita un parpadeo si la carga es casi instantánea
  let loaderShownAt = typeof performance !== 'undefined' ? performance.now() : 0;
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  function showAppLoader() {
    clearTimeout(hideTimer);
    loaderShownAt = performance.now();
    isAppLoading.value = true;
  }

  function hideAppLoader() {
    clearTimeout(hideTimer);
    const restante = Math.max(0, MIN_LOADER_MS - (performance.now() - loaderShownAt));
    hideTimer = setTimeout(() => (isAppLoading.value = false), restante);
  }

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isDarkMode,
    toggleSidebar,
    closeMobileSidebar,
    toggleTheme,
    isAppLoading,
    showAppLoader,
    hideAppLoader,
  };
});
