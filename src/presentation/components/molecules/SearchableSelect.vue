<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { coincide } from '../../utils/texto';

// Alto aproximado del panel (buscador + lista) para decidir si abre hacia arriba o hacia abajo
const PANEL_MAX = 340;
const GAP = 6;

export interface SelectOption {
  value: string | number;
  label: string;
  code?: string;
  badge?: string;
  subtitle?: string;
}

interface Props {
  modelValue: string | number | null | undefined;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seleccione una opción...',
  searchPlaceholder: 'Escriba para filtrar por código o nombre...',
  required: false,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const searchInput = ref<HTMLInputElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const dropdownRef = ref<HTMLDivElement | null>(null);

// El panel se renderiza en <body> con position: fixed para que no lo recorte
// un contenedor con scroll (p. ej. el cuerpo de un modal).
const panelStyle = ref<Record<string, string>>({});
const listMaxHeight = ref(240);
const openUpwards = ref(false);

const updatePosition = () => {
  const trigger = containerRef.value;
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom - GAP - 8;
  const spaceAbove = rect.top - GAP - 8;
  openUpwards.value = spaceBelow < PANEL_MAX && spaceAbove > spaceBelow;
  const available = openUpwards.value ? spaceAbove : spaceBelow;
  // ~90px los ocupa la barra de búsqueda
  listMaxHeight.value = Math.max(120, Math.min(240, available - 90));
  panelStyle.value = {
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    ...(openUpwards.value
      ? { bottom: `${window.innerHeight - rect.top + GAP}px` }
      : { top: `${rect.bottom + GAP}px` }),
  };
};

const onViewportChange = () => {
  if (isOpen.value) updatePosition();
};

const selectedOption = computed(() => {
  return props.options.find((opt) => String(opt.value) === String(props.modelValue)) || null;
});

// Sin importar tildes ni mayúsculas, y las palabras en cualquier orden y en cualquier campo
const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return props.options;

  return props.options.filter((opt) =>
    coincide([opt.label, opt.code, opt.badge, opt.subtitle].filter(Boolean).join(' '), searchQuery.value),
  );
});

const toggleOpen = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    updatePosition();
    searchQuery.value = '';
    nextTick(() => {
      searchInput.value?.focus();
    });
  }
};

const selectOption = (opt: SelectOption) => {
  emit('update:modelValue', opt.value);
  isOpen.value = false;
  searchQuery.value = '';
};

const clearSelection = (e: MouseEvent) => {
  e.stopPropagation();
  emit('update:modelValue', '');
};

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (containerRef.value && !containerRef.value.contains(target) && !dropdownRef.value?.contains(target)) {
    isOpen.value = false;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && isOpen.value) {
    // Que Escape solo cierre la lista y no llegue al modal (que vibraría)
    e.stopPropagation();
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', onViewportChange);
  // capture: true para enterarse del scroll de cualquier contenedor (el cuerpo del modal)
  window.addEventListener('scroll', onViewportChange, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', onViewportChange);
  window.removeEventListener('scroll', onViewportChange, true);
});
</script>

<template>
  <div ref="containerRef" class="relative w-full text-left font-sans">
    <!-- Trigger Button -->
    <div
      @click="toggleOpen"
      :class="[
        'w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border text-sm transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none',
        isOpen 
          ? 'ring-2 ring-blue-500/20 border-[#0d6efd] bg-white dark:bg-[#18181b]' 
          : 'border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] hover:border-neutral-400 dark:hover:border-neutral-600',
        disabled ? 'opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800' : ''
      ]"
    >
      <!-- Opción Seleccionada -->
      <div v-if="selectedOption" class="flex items-center gap-2 min-w-0 flex-1">
        <!-- Código en Badge si existe -->
        <span 
          v-if="selectedOption.code" 
          class="shrink-0 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[11px] font-bold text-blue-700 dark:text-blue-300 font-mono tracking-tight"
        >
          {{ selectedOption.code }}
        </span>

        <!-- Texto / Descripción -->
        <span class="truncate text-xs font-semibold text-neutral-800 dark:text-neutral-200" :title="selectedOption.label">
          {{ selectedOption.label }}
        </span>

        <!-- Badge adicional (ej. Plazo) -->
        <span 
          v-if="selectedOption.badge" 
          class="hidden sm:inline-flex shrink-0 ml-auto px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-[11px] font-medium text-neutral-600 dark:text-neutral-400"
        >
          {{ selectedOption.badge }}
        </span>
      </div>

      <!-- Placeholder -->
      <div v-else class="text-xs text-neutral-400 dark:text-neutral-500 flex items-center gap-2 truncate">
        <svg class="w-4 h-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span class="truncate">{{ placeholder }}</span>
      </div>

      <!-- Acciones Derecha (Limpiar y Chevron) -->
      <div class="flex items-center gap-1.5 shrink-0 text-neutral-400">
        <button
          v-if="selectedOption && !disabled"
          type="button"
          @click="clearSelection"
          class="p-1 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Limpiar selección"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <svg 
          :class="['w-4 h-4 transition-transform duration-200', isOpen ? 'rotate-180 text-[#0d6efd]' : '']" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <!-- Dropdown Flotante con Buscador Integrado -->
    <teleport to="body">
    <div
      v-if="isOpen"
      ref="dropdownRef"
      :style="panelStyle"
      :class="[
        'fixed z-[75] bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden font-sans flex',
        openUpwards ? 'flex-col-reverse' : 'flex-col',
      ]"
    >
      <!-- Barra de Búsqueda -->
      <div :class="['p-2.5 bg-[#f8f9fa] dark:bg-[#202024] border-neutral-200 dark:border-neutral-800', openUpwards ? 'border-t' : 'border-b']">
        <div class="relative flex items-center">
          <svg class="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="searchPlaceholder"
            class="w-full pl-9 pr-3.5 py-2 text-xs bg-white dark:bg-[#18181b] border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
          />
        </div>
        <div class="flex items-center justify-between mt-1.5 px-1 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>{{ filteredOptions.length }} opciones disponibles</span>
          <span v-if="searchQuery" class="text-blue-600 dark:text-blue-400 font-medium">Filtrando</span>
        </div>
      </div>

      <!-- Lista de Opciones con Scroll Suave -->
      <div class="overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 p-1" :style="{ maxHeight: `${listMaxHeight}px` }">
        <div
          v-if="filteredOptions.length === 0"
          class="p-6 text-center text-xs text-neutral-400 dark:text-neutral-500"
        >
          No se encontraron opciones que coincidan con la búsqueda.
        </div>

        <button
          v-for="opt in filteredOptions"
          :key="opt.value"
          type="button"
          @click="selectOption(opt)"
          :class="[
            'w-full text-left p-2.5 rounded-xl transition-colors flex flex-col gap-1 cursor-pointer group',
            String(opt.value) === String(modelValue)
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800'
              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60 border border-transparent'
          ]"
        >
          <!-- Fila Superior: Código y Plazo/Badge -->
          <div class="flex items-center justify-between gap-2">
            <span 
              v-if="opt.code"
              :class="[
                'px-2 py-0.5 rounded text-[10px] font-bold font-mono',
                String(opt.value) === String(modelValue)
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors'
              ]"
            >
              {{ opt.code }}
            </span>

            <span 
              v-if="opt.badge" 
              class="px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 ml-auto shrink-0"
            >
              {{ opt.badge }}
            </span>
          </div>

          <!-- Fila Central: Nombre del Procedimiento / Descripción -->
          <div class="flex items-center justify-between gap-2">
            <span 
              :class="[
                'text-xs font-semibold leading-snug line-clamp-2',
                String(opt.value) === String(modelValue)
                  ? 'text-blue-900 dark:text-blue-200'
                  : 'text-neutral-800 dark:text-neutral-200 group-hover:text-[#0d6efd] transition-colors'
              ]"
            >
              {{ opt.label }}
            </span>

            <!-- Checkmark para el seleccionado -->
            <svg 
              v-if="String(opt.value) === String(modelValue)" 
              class="w-4 h-4 text-blue-600 shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <!-- Fila Inferior: Subtítulo si existe -->
          <p v-if="opt.subtitle" class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
            {{ opt.subtitle }}
          </p>
        </button>
      </div>
    </div>
    </teleport>
  </div>
</template>
