<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLogin } from '../../application/composables/useAuth';
import Input from '../components/atoms/Input.vue';
import Button from '../components/atoms/Button.vue';

const router = useRouter();
const loginMutation = useLogin();

const username = ref('');
const password = ref('');
const errorMsg = ref('');

const handleSubmit = (e: Event) => {
  e.preventDefault();
  errorMsg.value = '';
  
  if (!username.value || !password.value) {
    errorMsg.value = 'Todos los campos son obligatorios';
    return;
  }

  loginMutation.mutate(
    { username: username.value, password: password.value },
    {
      onSuccess: () => {
        router.push('/');
      },
      onError: (err: any) => {
        errorMsg.value = err.message || 'Credenciales inválidas';
      }
    }
  );
};
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="flex justify-center mb-6">
        <div class="w-16 h-16 bg-blue-600 rounded-lg shadow-lg flex items-center justify-center">
          <span class="text-3xl font-bold text-white">LF</span>
        </div>
      </div>
      <h2 class="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
        Sistema LF ITSE
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Plataforma unificada de gestión municipal
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-xl sm:px-10 border border-gray-100">
        <form class="space-y-6" @submit="handleSubmit">
          <Input
            label="Usuario institucional o DNI"
            v-model="username"
            placeholder="Ingrese su usuario"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            v-model="password"
            placeholder="••••••••"
            required
          />

          <div v-if="errorMsg || loginMutation.isError.value" class="p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-100">
            {{ errorMsg || (loginMutation.error.value as Error)?.message || 'Credenciales inválidas' }}
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              class="w-full shadow-md hover:shadow-lg transition-all py-2.5 text-base"
              :is-loading="loginMutation.isPending.value"
            >
              Iniciar Sesión
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
