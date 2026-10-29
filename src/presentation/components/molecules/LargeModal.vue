<script setup lang="ts">
import ModalShell from './ModalShell.vue';

interface Props {
  modelValue: boolean;
  title: string;
  subtitle?: string;
  maxWidth?: string;
  isLoading?: boolean;
  submitText?: string;
  hasDraft?: boolean;
  isEditMode?: boolean;
  /** false en formularios que no guardan borrador: el aviso de persistencia sería falso */
  guardaBorrador?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: 'max-w-3xl',
  isLoading: false,
  submitText: 'Guardar Registro',
  hasDraft: false,
  isEditMode: false,
  guardaBorrador: true,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit'): void;
  (e: 'discard-draft'): void;
}>();

// Solo se cierra con la X o con "Cancelar": clic fuera o Escape hacen vibrar el modal (ModalShell).
const close = () => {
  if (!props.isLoading) {
    emit('update:modelValue', false);
  }
};

</script>

<template>
  <ModalShell :open="modelValue" :max-width="maxWidth" labelledby="large-modal-title">
      <div
        class="relative w-full bg-white dark:bg-[#18181b] rounded-3xl shadow-2xl border border-neutral-200/90 dark:border-neutral-800 flex flex-col overflow-hidden transition-colors select-none"
      >
        <!-- Cabecera del Modal (#f4f4f4 con separador sutil) -->
        <div class="px-6 py-4 bg-[#f4f4f4] dark:bg-[#202024] border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 transition-colors">
          <div class="space-y-0.5">
            <div class="flex items-center gap-2.5">
              <h3 id="large-modal-title" class="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {{ title }}
              </h3>

              <!-- Badge Indicador de Borrador en LocalStorage -->
              <span 
                v-if="hasDraft && !isEditMode" 
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
                title="Los datos fueron autoguardados y recuperados desde tu navegador"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Borrador recuperado
              </span>
            </div>
            <p v-if="subtitle" class="text-xs text-neutral-500 dark:text-neutral-400">
              {{ subtitle }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <!-- Botón para descartar borrador -->
            <button
              v-if="hasDraft && !isEditMode"
              type="button"
              @click="emit('discard-draft')"
              class="px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg border border-red-200 dark:border-red-800/80 transition-colors cursor-pointer"
              title="Borrar borrador guardado y limpiar campos"
            >
              Limpiar borrador
            </button>

            <!-- Botón de Cerrar (X) -->
            <button 
              type="button"
              @click="close"
              :disabled="isLoading"
              class="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Cerrar modal"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Cuerpo del Formulario (Scrollable) -->
        <form @submit.prevent="emit('submit')" class="flex flex-col flex-1 overflow-hidden">
          <div class="px-6 sm:px-8 py-5 overflow-y-auto max-h-[68vh] space-y-4 text-neutral-800 dark:text-neutral-200">
            <slot></slot>
          </div>

          <!-- Pie del Modal (#f4f4f4 con acciones y estado de persistencia) -->
          <div class="px-6 py-4 bg-[#f4f4f4] dark:bg-[#202024] border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 transition-colors">
            <!-- Indicador de Persistencia en Vivo -->
            <div v-if="guardaBorrador" class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span class="relative flex h-2 w-2">
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400">
                Persistencia en LocalStorage activa
              </span>
            </div>

            <!-- Botones de Acción -->
            <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end sm:ml-auto">
              <button 
                type="button"
                @click="close"
                :disabled="isLoading"
                class="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              <button 
                type="submit"
                :disabled="isLoading"
                class="px-6 py-2 rounded-xl bg-[#0d6efd] hover:bg-blue-600 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="isLoading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>{{ isLoading ? 'Guardando...' : submitText }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
  </ModalShell>
</template>
