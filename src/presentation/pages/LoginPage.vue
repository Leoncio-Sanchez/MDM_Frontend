<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useLogin } from '../../application/composables/useAuth';
import Input from '../components/atoms/Input.vue';

const router = useRouter();
const loginMutation = useLogin();

const username = ref('');
const password = ref('');
const errorMsg = ref('');

const handleSubmit = (e: Event) => {
  e.preventDefault();
  errorMsg.value = '';
  
  if (!username.value.trim()) {
    errorMsg.value = 'El nombre de usuario es obligatorio';
    return;
  }

  if (!password.value) {
    errorMsg.value = 'La contraseña es obligatoria';
    return;
  }

  loginMutation.mutate(
    { username: username.value, password: password.value },
    {
      onSuccess: () => {
        router.push('/');
      },
      onError: (err: any) => {
        const backendMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
        errorMsg.value = backendMsg || 'Credenciales inválidas. Por favor verifique sus datos.';
      }
    }
  );
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white p-4 sm:p-6 select-none font-sans">
    <!-- Card Contenedor Principal en Paleta #f4f4f4 y Blanco Puro -->
    <div class="max-w-4xl w-full bg-[#f4f4f4] rounded-3xl shadow-xl border border-neutral-200/90 overflow-hidden flex flex-col md:flex-row">
      
      <!-- Panel Izquierdo: Branding Institucional con Escudo Municipal -->
      <div class="w-full md:w-5/12 bg-[#ececec]/60 p-8 sm:p-10 flex flex-col justify-between items-center border-b md:border-b-0 md:border-r border-neutral-200 text-center">
        <!-- Badge Superior -->
        <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-neutral-200 text-[11px] font-bold text-[#0d6efd] shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-[#0d6efd]"></span>
          Plataforma Municipal Oficial
        </span>

        <!-- Escudo Municipal e Identidad LF e ITSE -->
        <div class="my-auto py-8 flex flex-col items-center">
          <div class="w-28 sm:w-32 h-28 sm:h-32 mb-6 flex items-center justify-center p-2 rounded-2xl bg-white border border-neutral-200 shadow-xs">
            <img 
              src="/images/escudo-dashboard.png" 
              alt="Escudo Municipal" 
              class="max-h-full max-w-full object-contain drop-shadow-xs" 
            />
          </div>
          <h2 class="text-2xl font-extrabold text-neutral-900 tracking-tight">MUNI_APP</h2>
          
          <!-- Texto Profesional de Gestión LF e ITSE -->
          <p class="text-xs font-bold text-neutral-500 uppercase tracking-widest text-center mt-3 max-w-[240px] leading-relaxed">
            GESTIÓN Y ADMINISTRACIÓN DE LF E ITSE
          </p>
          <p class="text-[11px] text-neutral-400 mt-2 max-w-[220px]">
            Licencias de Funcionamiento e Inspecciones Técnicas de Seguridad
          </p>
        </div>

        <!-- Pie Institucional -->
        <p class="text-[11px] font-medium text-neutral-400">
          Municipalidad Distrital · © 2026
        </p>
      </div>

      <!-- Panel Derecho: Formulario de Autenticación -->
      <div class="w-full md:w-7/12 bg-white p-8 sm:p-12 flex flex-col justify-center">
        <div class="mb-8">
          <h3 class="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Acceso al Sistema
          </h3>
          <p class="text-xs text-neutral-500 mt-1.5">
            Ingrese sus credenciales autorizadas para gestionar los expedientes
          </p>
        </div>

        <!-- Banner de Error Elegante -->
        <div 
          v-if="errorMsg || loginMutation.error.value" 
          class="bg-red-50 border border-red-200/90 text-red-700 px-4 py-3 rounded-xl mb-6 text-xs font-medium flex items-start gap-2.5 shadow-2xs"
        >
          <svg class="w-4 h-4 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{{ errorMsg || (loginMutation.error.value as any)?.response?.data?.message || (loginMutation.error.value as Error)?.message || 'Credenciales inválidas' }}</span>
        </div>

        <!-- Formulario -->
        <form @submit="handleSubmit" class="space-y-5 w-full">
          <div>
            <Input 
              label="Usuario Institucional" 
              placeholder="Ej. admin o inspector" 
              v-model="username" 
              :disabled="loginMutation.isPending.value" 
              required 
            />
          </div>

          <div>
            <Input 
              label="Contraseña de Seguridad" 
              type="password" 
              placeholder="••••••••••••" 
              v-model="password" 
              :disabled="loginMutation.isPending.value" 
              required 
            />
          </div>

          <!-- Botón de Ingreso con Bootstrap Primary #0d6efd -->
          <div class="pt-2">
            <button 
              type="submit" 
              :disabled="loginMutation.isPending.value"
              class="w-full py-3 px-4 rounded-xl bg-[#0d6efd] hover:bg-blue-600 text-white font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loginMutation.isPending.value" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <span>{{ loginMutation.isPending.value ? 'Iniciando sesión...' : 'Ingresar al Sistema' }}</span>
            </button>
          </div>
        </form>

        <!-- Sello de Seguridad -->
        <div class="mt-8 pt-6 border-t border-neutral-100 flex items-center justify-center gap-2 text-xs text-neutral-400">
          <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Conexión segura cifrada SSL/TLS</span>
        </div>
      </div>
    </div>
  </div>
</template>
