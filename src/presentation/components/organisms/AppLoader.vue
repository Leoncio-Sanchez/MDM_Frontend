<script setup lang="ts">
import { useUiStore } from '../../../infrastructure/store/useUiStore';

/**
 * Loader de pantalla completa con el escudo de la municipalidad.
 * Solo se usa al abrir/recargar la app y al ingresar tras el login (ver router).
 * Para cargas de datos dentro de las páginas se usan skeletons, no este loader.
 */
const ui = useUiStore();
</script>

<template>
  <Transition name="app-loader">
    <div
      v-if="ui.isAppLoading"
      class="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-6 bg-[#f4f4f4] dark:bg-[#0f0f11] select-none font-sans"
      role="status"
      aria-live="polite"
    >
      <div class="relative w-36 h-36 flex items-center justify-center">
        <!-- Anillo giratorio alrededor del escudo -->
        <svg class="app-loader-ring absolute inset-0 w-full h-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke-width="3" class="stroke-neutral-200 dark:stroke-neutral-800" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="72 217"
            class="stroke-[#0d6efd] dark:stroke-blue-400"
          />
        </svg>
        <img
          src="/images/escudo-dashboard.png"
          alt="Escudo de la Municipalidad Distrital de Morales"
          class="app-loader-logo w-20 h-auto drop-shadow-md"
          draggable="false"
        />
      </div>

      <div class="text-center">
        <p class="text-lg font-extrabold tracking-tight text-[#00356a] dark:text-white">MUNI_APP</p>
        <p class="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400 mt-0.5">
          Sistema LF &amp; ITSE
        </p>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-4">Cargando…</p>
      </div>
    </div>
  </Transition>
</template>
