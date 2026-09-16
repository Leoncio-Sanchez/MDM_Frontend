<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  disabled: false,
  isLoading: false,
  type: 'button',
  class: '',
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="isLoading || disabled"
    :class="[
      'flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors',
      variant === 'primary' && 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      variant === 'secondary' && 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
      variant === 'danger' && 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500',
      $props.class
    ]"
    @click="emit('click', $event)"
  >
    <template v-if="isLoading">Cargando...</template>
    <slot v-else />
  </button>
</template>
