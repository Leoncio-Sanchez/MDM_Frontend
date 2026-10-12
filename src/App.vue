<script setup lang="ts">
import AlertDialog from './presentation/components/organisms/AlertDialog.vue';
import ToastContainer from './presentation/components/organisms/ToastContainer.vue';
import AppLoader from './presentation/components/organisms/AppLoader.vue';
</script>

<template>
  <RouterView />
  <AlertDialog />
  <ToastContainer />
  <AppLoader />
</template>
