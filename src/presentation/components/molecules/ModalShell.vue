<script setup lang="ts">
import { ref, watch, onUnmounted, nextTick } from 'vue';

/**
 * Contenedor base de todos los modales.
 * - NO se cierra al hacer clic fuera ni con Escape: el modal vibra para indicar
 *   que hay que usar los botones (Cerrar / Cancelar / Aceptar).
 * - Bloquea el scroll del fondo mientras está abierto.
 */
interface Props {
  open: boolean;
  maxWidth?: string;
  /** z-index: los diálogos de confirmación van por encima de los formularios. */
  layer?: 'modal' | 'dialog';
  labelledby?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'max-w-3xl',
  layer: 'modal',
});

const isShaking = ref(false);
const panel = ref<HTMLElement | null>(null);
let shakeTimer: ReturnType<typeof setTimeout> | undefined;
// Contador global de modales abiertos para bloquear/restaurar el scroll del body.
const openCountKey = '__muniOpenModals';

const shake = () => {
  const el = panel.value;
  if (!el) return;
  clearTimeout(shakeTimer);
  // Reinicia la animación aunque se haga clic varias veces seguidas:
  // quitar la clase, forzar un reflow y volver a ponerla.
  el.classList.remove('modal-shake');
  void el.offsetWidth;
  el.classList.add('modal-shake');
  isShaking.value = true;
  shakeTimer = setTimeout(() => {
    el.classList.remove('modal-shake');
    isShaking.value = false;
  }, 450);
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Escape') return;
  // Solo vibra el modal de más arriba (el último abierto).
  const stack = document.querySelectorAll('[data-modal-panel]');
  if (stack[stack.length - 1] === panel.value) {
    e.preventDefault();
    shake();
  }
};

const lockScroll = (lock: boolean) => {
  const w = window as any;
  w[openCountKey] = Math.max(0, (w[openCountKey] || 0) + (lock ? 1 : -1));
  document.body.style.overflow = w[openCountKey] > 0 ? 'hidden' : '';
};

watch(
  () => props.open,
  async (isOpen, wasOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      lockScroll(true);
      await nextTick();
      panel.value?.focus();
    } else if (wasOpen) {
      window.removeEventListener('keydown', handleKeyDown);
      lockScroll(false);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  if (props.open) {
    window.removeEventListener('keydown', handleKeyDown);
    lockScroll(false);
  }
  clearTimeout(shakeTimer);
});

defineExpose({ shake });
</script>

<template>
  <teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        :class="[
          layer === 'dialog' ? 'z-[70]' : 'z-50',
          'fixed inset-0 flex items-center justify-center p-3 sm:p-6 bg-neutral-900/60 backdrop-blur-xs overflow-y-auto font-sans',
        ]"
        @mousedown.self="shake"
      >
        <div
          ref="panel"
          data-modal-panel
          tabindex="-1"
          :class="[maxWidth, 'modal-panel relative w-full my-auto outline-none']"
          :data-shaking="isShaking || undefined"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="labelledby"
        >
          <slot></slot>
        </div>
      </div>
    </Transition>
  </teleport>
</template>
