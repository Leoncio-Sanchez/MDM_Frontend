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
  
  if (!username.value.trim()) {
    alert('El usuario es requerido');
    return;
  }

  loginMutation.mutate(
    { username: username.value, password: password.value },
    {
      onSuccess: () => {
        router.push('/');
      },
      onError: () => {
        // Error handled in state (loginMutation.error)
      }
    }
  );
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
    <div class="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden flex">
      <div class="w-1/2 bg-blue-50 p-12 flex-col justify-center items-center hidden md:flex">
        <img src="/images/img-login.png" alt="Sistema LF ITSE" class="max-w-xs mb-8 drop-shadow-md" />
        <h2 class="text-2xl font-bold text-blue-900 text-center">Sistema LF ITSE</h2>
      </div>
      <div class="w-full md:w-1/2 p-12 flex flex-col justify-center">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900">Iniciar Sesión</h2>
        </div>
        <div v-if="loginMutation.error.value || errorMsg" class="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">
          {{ errorMsg || (loginMutation.error.value as Error)?.message || 'Credenciales inválidas' }}
        </div>
        <form @submit="handleSubmit" class="space-y-6 w-full">
          <Input 
            label="Usuario" 
            placeholder="Ingrese su usuario" 
            v-model="username" 
            :disabled="loginMutation.isPending.value" 
            required 
          />
          <Input 
            label="Contraseña" 
            type="password" 
            placeholder="Ingrese su contraseña" 
            v-model="password" 
            :disabled="loginMutation.isPending.value" 
            required 
          />
          <Button 
            type="submit" 
            :is-loading="loginMutation.isPending.value" 
            class="w-full py-3 text-base"
          >
            Ingresar
          </Button>
        </form>
      </div>
    </div>
  </div>
</template>
