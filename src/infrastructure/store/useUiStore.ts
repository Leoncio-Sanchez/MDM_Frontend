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

  return {
    isSidebarCollapsed,
    isMobileSidebarOpen,
    isDarkMode,
    toggleSidebar,
    closeMobileSidebar,
    toggleTheme,
  };
});
