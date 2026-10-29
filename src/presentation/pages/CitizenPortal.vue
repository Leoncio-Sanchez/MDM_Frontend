<script setup lang="ts">
import { useAuthStore } from '../../infrastructure/store/useAuthStore';

/**
 * Cuentas sin acceso al sistema interno (ni personal ni inspector). Aún no hay trámites en
 * línea para ciudadanos: falta definir con la municipalidad cómo se vincula una cuenta con su
 * persona y cómo se crean esas cuentas. Mientras tanto se les orienta a la consulta pública,
 * en lugar de mostrar botones que no hacen nada.
 */
const authStore = useAuthStore();
</script>

<template>
  <div class="max-w-2xl mx-auto py-6 sm:py-10">
    <section class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-6 sm:p-8 space-y-5">
      <div>
        <h1 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
          Hola{{ authStore.user?.username ? `, ${authStore.user.username}` : '' }}
        </h1>
        <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-2">
          Su cuenta no tiene acceso a la gestión interna del sistema. Los trámites de licencia de funcionamiento e ITSE se
          presentan en la mesa de partes de la municipalidad.
        </p>
      </div>

      <div class="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 p-4 sm:p-5">
        <h2 class="text-sm font-bold text-neutral-900 dark:text-white">¿Ya presentó su solicitud?</h2>
        <p class="text-sm text-neutral-700 dark:text-neutral-300 mt-1">
          Consulte en qué estado está con el número de expediente que figura en su cargo de recepción.
        </p>
        <router-link
          to="/consulta"
          class="mt-4 inline-flex items-center justify-center h-11 px-5 rounded-xl bg-[#0d6efd] hover:bg-blue-600 text-white text-sm font-semibold"
        >
          Consultar mi trámite
        </router-link>
      </div>

      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        Si usted es personal de la municipalidad y debería tener acceso, pida al administrador del sistema que habilite su cuenta.
      </p>
    </section>
  </div>
</template>
