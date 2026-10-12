<script setup lang="ts">
import { onUnmounted, reactive } from 'vue';
import { useNotificationStore, type NotifyVariant, type Toast } from '../../../infrastructure/store/useNotificationStore';

/** Pila de notificaciones tipo Toastify. Se monta una sola vez en App.vue y se usa con useToast(). */
const store = useNotificationStore();

const styles: Record<NotifyVariant, { accent: string; icon: string; bar: string; title: string }> = {
  success: {
    accent: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50',
    icon: 'M5 13l4 4L19 7',
    bar: 'bg-emerald-500',
    title: 'Éxito',
  },
  error: {
    accent: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50',
    icon: 'M6 18L18 6M6 6l12 12',
    bar: 'bg-red-500',
    title: 'Error',
  },
  warning: {
    accent: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    bar: 'bg-amber-500',
    title: 'Atención',
  },
  info: {
    accent: 'text-[#0d6efd] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    bar: 'bg-[#0d6efd]',
    title: 'Información',
  },
};

// Temporizadores por toast, con pausa al pasar el mouse por encima.
const timers = new Map<number, { handle?: ReturnType<typeof setTimeout>; remaining: number; startedAt: number }>();
const paused = reactive(new Set<number>());

const start = (toast: Toast) => {
  const t = timers.get(toast.id) ?? { remaining: toast.duration, startedAt: 0 };
  t.startedAt = Date.now();
  t.handle = setTimeout(() => close(toast.id), t.remaining);
  timers.set(toast.id, t);
};

const pause = (toast: Toast) => {
  const t = timers.get(toast.id);
  if (!t) return;
  clearTimeout(t.handle);
  t.remaining -= Date.now() - t.startedAt;
  paused.add(toast.id);
};

const resume = (toast: Toast) => {
  paused.delete(toast.id);
  start(toast);
};

const close = (id: number) => {
  clearTimeout(timers.get(id)?.handle);
  timers.delete(id);
  paused.delete(id);
  store.dismissToast(id);
};

// Arranca el temporizador cuando el toast entra en el DOM.
const onEnter = (el: Element) => {
  const id = Number((el as HTMLElement).dataset.toastId);
  const toast = store.toasts.find((t) => t.id === id);
  if (toast && !timers.has(id)) start(toast);
};

onUnmounted(() => timers.forEach((t) => clearTimeout(t.handle)));
</script>

<template>
  <teleport to="body">
    <div
      class="fixed top-4 right-4 left-4 sm:left-auto z-[80] flex flex-col gap-2.5 sm:w-96 pointer-events-none font-sans"
      aria-live="polite"
      aria-atomic="false"
    >
      <TransitionGroup name="toast" @enter="onEnter">
        <div
          v-for="toast in store.toasts"
          :key="toast.id"
          :data-toast-id="toast.id"
          :role="toast.variant === 'error' ? 'alert' : 'status'"
          class="relative pointer-events-auto overflow-hidden rounded-xl bg-white dark:bg-[#202024] border border-neutral-200 dark:border-neutral-700 shadow-lg"
          @mouseenter="pause(toast)"
          @mouseleave="resume(toast)"
        >
          <div class="flex items-start gap-3 p-3.5 pr-10">
            <div :class="[styles[toast.variant].accent, 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0']">
              <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.25">
                <path stroke-linecap="round" stroke-linejoin="round" :d="styles[toast.variant].icon" />
              </svg>
            </div>
            <div class="min-w-0 pt-0.5">
              <p class="text-sm font-semibold text-neutral-900 dark:text-white">
                {{ toast.title || styles[toast.variant].title }}
              </p>
              <p class="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed break-words">
                {{ toast.message }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="close(toast.id)"
            class="absolute top-2.5 right-2.5 p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <!-- Barra de progreso del tiempo restante -->
          <div
            :class="[styles[toast.variant].bar, 'toast-progress absolute bottom-0 left-0 h-[3px] w-full opacity-80']"
            :style="{ animationDuration: toast.duration + 'ms', animationPlayState: paused.has(toast.id) ? 'paused' : 'running' }"
          ></div>
        </div>
      </TransitionGroup>
    </div>
  </teleport>
</template>
