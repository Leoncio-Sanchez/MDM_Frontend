<script setup lang="ts">
/**
 * Bloque gris con brillo animado que ocupa el lugar del contenido mientras carga.
 * El tamaño y la forma se controlan con clases: <Skeleton class="h-4 w-32" />,
 * <Skeleton class="h-10 w-10" rounded="full" />.
 * Es decorativo (aria-hidden): el contenedor que lo usa anuncia el estado de carga.
 */
withDefaults(defineProps<{ rounded?: 'md' | 'lg' | 'xl' | 'full' }>(), { rounded: 'md' });
</script>

<template>
  <span
    aria-hidden="true"
    :class="[
      'skeleton block',
      { md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full' }[rounded],
    ]"
  ></span>
</template>
