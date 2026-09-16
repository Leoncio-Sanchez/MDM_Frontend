<script setup lang="ts">
interface Props {
  modelValue: string | number;
  label: string;
  error?: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  class?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
  class: '',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// Vue's native way to handle forwardRef for the input element
import { ref } from 'vue';
const inputRef = ref<HTMLInputElement | null>(null);
defineExpose({
  input: inputRef,
});
</script>

<template>
  <div class="w-full">
    <label class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
    </label>
    <input
      ref="inputRef"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :required="required"
      :class="[
        'block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border',
        error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : '',
        $props.class
      ]"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <p v-if="error" class="mt-2 text-sm text-red-600">{{ error }}</p>
  </div>
</template>
