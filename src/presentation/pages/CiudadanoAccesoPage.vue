<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAccesoCiudadano } from '../../application/composables/useConsultaPublica';
import { extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { CLAVE_CIUDADANO_MINIMO } from '../../domain/entities/ConsultaPublica.entity';

/**
 * Acceso del ciudadano a "Mis trámites": ingresar con su DNI/RUC, crear su cuenta o
 * restablecer la contraseña. Para crearla o restablecerla prueba que el documento es suyo
 * con el número de uno de sus expedientes (está en su cargo de recepción).
 */
type Modo = 'ingresar' | 'registrar' | 'restablecer';

const router = useRouter();
const { ingresar, registrar, restablecer } = useAccesoCiudadano();

const modo = ref<Modo>('ingresar');
const form = ref({ documento: '', numero: '', clave: '', confirmacion: '' });
const errores = ref<Record<string, string>>({});

const MODOS: { valor: Modo; texto: string }[] = [
  { valor: 'ingresar', texto: 'Ingresar' },
  { valor: 'registrar', texto: 'Crear cuenta' },
];

const enviando = computed(() => ingresar.isPending.value || registrar.isPending.value || restablecer.isPending.value);
const pideExpediente = computed(() => modo.value !== 'ingresar');

const cambiar = (nuevo: Modo) => {
  modo.value = nuevo;
  errores.value = {};
  form.value.clave = '';
  form.value.confirmacion = '';
};

/** Mismas reglas que el servidor, para avisar antes de enviar */
const validar = (): boolean => {
  const e: Record<string, string> = {};
  const f = form.value;
  if (!/^[0-9A-Za-z]{8,12}$/.test(f.documento.trim())) e.documento = 'Ingrese un DNI (8 dígitos), RUC (11 dígitos) o carné de extranjería válido.';
  if (modo.value === 'ingresar') {
    if (!f.clave) e.clave = 'Ingrese su contraseña.';
  } else {
    if (!/^\d+$/.test(f.numero.trim()) || Number(f.numero) < 1) e.numero = 'Ingrese el número de uno de sus expedientes, solo dígitos.';
    if (f.clave.length < CLAVE_CIUDADANO_MINIMO) e.clave = `La contraseña debe tener al menos ${CLAVE_CIUDADANO_MINIMO} caracteres.`;
    else if (!/[A-Za-z]/.test(f.clave) || !/\d/.test(f.clave)) e.clave = 'La contraseña debe tener letras y números.';
    else if (f.clave.toUpperCase() === f.documento.trim().toUpperCase()) e.clave = 'La contraseña no puede ser su DNI o RUC.';
    if (f.clave !== f.confirmacion) e.confirmacion = 'Las contraseñas no coinciden.';
  }
  errores.value = e;
  return Object.keys(e).length === 0;
};

/** 422 de validación ({ errors }) o de la regla ({ error }); 401 de contraseña ({ detail }); 429 de intentos */
const mostrarError = (err: unknown) => {
  const respuesta = (err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } })?.response;
  const campos = respuesta?.data?.errors;
  if (campos) {
    const nombres: Record<string, string> = { numero_expediente: 'numero', clave: 'clave', documento: 'documento' };
    errores.value = Object.fromEntries(Object.entries(campos).map(([campo, msgs]) => [nombres[campo] ?? 'general', msgs[0]]));
    return;
  }
  errores.value = {
    general: respuesta?.status ? extractErrorMessage(err) : 'No pudimos conectarnos con el sistema. Intente nuevamente en unos minutos.',
  };
};

const enviar = (ev: Event) => {
  ev.preventDefault();
  if (!validar()) return;
  const f = form.value;
  const alTerminar = { onSuccess: () => router.push('/ciudadano'), onError: mostrarError };

  if (modo.value === 'ingresar') {
    ingresar.mutate({ documento: f.documento.trim(), clave: f.clave }, alTerminar);
    return;
  }
  const datos = { documento: f.documento.trim(), numero_expediente: Number(f.numero), clave: f.clave, clave_confirmation: f.confirmacion };
  (modo.value === 'registrar' ? registrar : restablecer).mutate(datos, alTerminar);
};

const titulo = computed(() => ({ ingresar: 'Ingrese a Mis trámites', registrar: 'Cree su cuenta', restablecer: 'Restablezca su contraseña' })[modo.value]);
const boton = computed(() => ({ ingresar: 'Ingresar', registrar: 'Crear cuenta e ingresar', restablecer: 'Guardar contraseña e ingresar' })[modo.value]);

const claseCampo = (campo: string) => [
  'block w-full rounded-xl border px-3.5 py-2.5 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-[#0B3C5D]',
  errores.value[campo] ? 'border-red-400' : 'border-neutral-300',
];
</script>

<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans text-neutral-800">
    <header class="bg-[#0B3C5D] text-white">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <img src="/images/escudo-dashboard.png" alt="Escudo municipal" class="h-11 w-auto drop-shadow-xs" />
        <div class="leading-tight">
          <p class="text-[11px] uppercase tracking-widest text-sky-200 font-semibold">Municipalidad Distrital</p>
          <h1 class="text-lg sm:text-xl font-bold">Mis trámites</h1>
        </div>
      </div>
    </header>

    <main class="max-w-md mx-auto px-4 py-6 sm:py-10 space-y-5">
      <section class="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 sm:p-7">
        <div v-if="modo !== 'restablecer'" class="grid grid-cols-2 gap-1 p-1 rounded-xl bg-neutral-100 mb-5" role="tablist" aria-label="Cuenta">
          <button
            v-for="m in MODOS"
            :key="m.valor"
            type="button"
            role="tab"
            :aria-selected="modo === m.valor"
            :class="[
              'h-9 rounded-lg text-sm font-semibold transition-colors cursor-pointer',
              modo === m.valor ? 'bg-white text-[#0B3C5D] shadow-xs' : 'text-neutral-600 hover:text-neutral-900',
            ]"
            @click="cambiar(m.valor)"
          >
            {{ m.texto }}
          </button>
        </div>

        <h2 class="text-base sm:text-lg font-bold text-neutral-900">{{ titulo }}</h2>
        <p v-if="modo === 'ingresar'" class="text-xs text-neutral-500 mt-1">Vea en un solo lugar todos los trámites a su nombre.</p>
        <p v-else class="text-xs text-neutral-500 mt-1">
          Para comprobar que el DNI o RUC es suyo, escriba el número de uno de sus expedientes: está en el cargo que le
          entregó mesa de partes.
        </p>

        <form class="mt-5 space-y-4" novalidate @submit="enviar">
          <div v-if="errores.general" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {{ errores.general }}
          </div>

          <div>
            <label for="ciu-documento" class="block text-sm font-medium text-neutral-700 mb-1">DNI o RUC</label>
            <input
              id="ciu-documento"
              v-model="form.documento"
              type="text"
              inputmode="numeric"
              autocomplete="username"
              maxlength="12"
              placeholder="8 u 11 dígitos"
              :aria-invalid="!!errores.documento"
              :class="claseCampo('documento')"
            />
            <p v-if="errores.documento" class="mt-1 text-xs text-red-600">{{ errores.documento }}</p>
          </div>

          <div v-if="pideExpediente">
            <label for="ciu-expediente" class="block text-sm font-medium text-neutral-700 mb-1">Número de uno de sus expedientes</label>
            <input
              id="ciu-expediente"
              v-model="form.numero"
              type="text"
              inputmode="numeric"
              placeholder="Ej. 1250"
              :aria-invalid="!!errores.numero"
              :class="claseCampo('numero')"
            />
            <p v-if="errores.numero" class="mt-1 text-xs text-red-600">{{ errores.numero }}</p>
          </div>

          <div>
            <label for="ciu-clave" class="block text-sm font-medium text-neutral-700 mb-1">
              {{ modo === 'ingresar' ? 'Contraseña' : 'Nueva contraseña' }}
            </label>
            <input
              id="ciu-clave"
              v-model="form.clave"
              type="password"
              :autocomplete="modo === 'ingresar' ? 'current-password' : 'new-password'"
              maxlength="100"
              :aria-invalid="!!errores.clave"
              :class="claseCampo('clave')"
            />
            <p v-if="errores.clave" class="mt-1 text-xs text-red-600">{{ errores.clave }}</p>
            <p v-else-if="pideExpediente" class="mt-1 text-[11px] text-neutral-500">
              Al menos {{ CLAVE_CIUDADANO_MINIMO }} caracteres, con letras y números.
            </p>
          </div>

          <div v-if="pideExpediente">
            <label for="ciu-confirmacion" class="block text-sm font-medium text-neutral-700 mb-1">Repita la contraseña</label>
            <input
              id="ciu-confirmacion"
              v-model="form.confirmacion"
              type="password"
              autocomplete="new-password"
              maxlength="100"
              :aria-invalid="!!errores.confirmacion"
              :class="claseCampo('confirmacion')"
            />
            <p v-if="errores.confirmacion" class="mt-1 text-xs text-red-600">{{ errores.confirmacion }}</p>
          </div>

          <button
            type="submit"
            :disabled="enviando"
            class="w-full h-11 rounded-xl bg-[#0B3C5D] hover:bg-[#0d4a73] text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="enviando" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ enviando ? 'Un momento…' : boton }}
          </button>
        </form>

        <p class="mt-4 text-center text-xs">
          <button v-if="modo === 'ingresar'" type="button" class="font-semibold text-[#0B3C5D] hover:underline cursor-pointer" @click="cambiar('restablecer')">
            Olvidé mi contraseña
          </button>
          <button v-else-if="modo === 'restablecer'" type="button" class="font-semibold text-[#0B3C5D] hover:underline cursor-pointer" @click="cambiar('ingresar')">
            Volver a ingresar
          </button>
        </p>
      </section>

      <p class="text-center text-xs text-neutral-600">
        ¿Solo quiere consultar un trámite?
        <router-link to="/consulta" class="font-semibold text-[#0B3C5D] hover:underline">Consúltelo sin cuenta</router-link>
      </p>
      <p class="text-center">
        <router-link to="/login" class="text-xs font-semibold text-neutral-500 hover:underline">Acceso para personal municipal</router-link>
      </p>
    </main>
  </div>
</template>
