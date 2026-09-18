<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'danger';
  isLoading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  type: 'button',
  isLoading: false,
  disabled: false
});
</script>

<template>
  <button
    :type="type"
    :disabled="isLoading || disabled"
    class="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
    :class="[
      variant === 'primary' ? 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : '',
      variant === 'secondary' ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 focus:ring-blue-500' : '',
      variant === 'danger' ? 'text-white bg-red-600 hover:bg-red-700 focus:ring-red-500' : ''
    ]"
  >
    <template v-if="isLoading">Cargando...</template>
    <slot v-else></slot>
  </button>
</template>
