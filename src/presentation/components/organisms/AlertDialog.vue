<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ModalShell from '../molecules/ModalShell.vue';
import { useNotificationStore, type DialogVariant } from '../../../infrastructure/store/useNotificationStore';

/** Diálogo global tipo SweetAlert. Se monta una sola vez en App.vue y se usa con useDialog(). */
const store = useNotificationStore();

// Conserva el último diálogo mientras se reproduce la animación de salida.
const current = ref(store.dialog);
watch(() => store.dialog, (d) => { if (d) current.value = d; });

const styles: Record<DialogVariant, { ring: string; icon: string; button: string }> = {
  success: {
    ring: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400',
    icon: 'M5 13l4 4L19 7',
    button: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-500/40',
  },
  error: {
    ring: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    icon: 'M6 18L18 6M6 6l12 12',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40',
  },
  danger: {
    ring: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    button: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500/40',
  },
  warning: {
    ring: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    button: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500/40',
  },
  info: {
    ring: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#0d6efd] dark:text-blue-400',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    button: 'bg-[#0d6efd] hover:bg-blue-600 focus-visible:ring-blue-500/40',
  },
  question: {
    ring: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-[#0d6efd] dark:text-blue-400',
    icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    button: 'bg-[#0d6efd] hover:bg-blue-600 focus-visible:ring-blue-500/40',
  },
};

const style = computed(() => styles[current.value?.variant ?? 'info']);
</script>

<template>
  <ModalShell :open="!!store.dialog" max-width="max-w-sm" layer="dialog" labelledby="alert-dialog-title">
    <div
      v-if="current"
      class="bg-white dark:bg-[#18181b] rounded-2xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 select-none"
    >
      <div
        :class="[style.ring, 'dialog-icon-pop w-14 h-14 rounded-full border flex items-center justify-center mx-auto mb-4 shadow-2xs']"
      >
        <svg class="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" :d="style.icon" />
        </svg>
      </div>

      <div class="text-center">
        <h3 id="alert-dialog-title" class="text-lg font-bold text-neutral-900 dark:text-white">
          {{ current.title }}
        </h3>
        <p v-if="current.text" class="text-sm text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed whitespace-pre-line">
          {{ current.text }}
        </p>
      </div>

      <div
        v-if="store.dialogError"
        class="mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 text-left"
        role="alert"
      >
        {{ store.dialogError }}
      </div>

      <div :class="[current.cancelText ? 'grid grid-cols-2' : 'flex justify-center', 'gap-3 mt-6']">
        <button
          v-if="current.cancelText"
          type="button"
          @click="store.cancelDialog()"
          :disabled="store.isDialogProcessing"
          class="w-full py-2.5 px-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ current.cancelText }}
        </button>
        <button
          type="button"
          @click="store.confirmDialog()"
          :disabled="store.isDialogProcessing"
          :class="[
            style.button,
            current.cancelText ? 'w-full' : 'min-w-32',
            'py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-4',
          ]"
        >
          <span v-if="store.isDialogProcessing" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>{{ store.isDialogProcessing ? 'Procesando...' : (current.confirmText || 'Aceptar') }}</span>
        </button>
      </div>
    </div>
  </ModalShell>
</template>
