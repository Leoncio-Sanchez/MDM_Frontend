<script setup lang="ts">
import { computed, ref } from 'vue';
import Input from '../components/atoms/Input.vue';
import TarjetaTramite from '../components/organisms/TarjetaTramite.vue';
import { useConsultaPublica } from '../../application/composables/useConsultaPublica';
import { extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { TipoTramite, TramitePublico } from '../../domain/entities/ConsultaPublica.entity';

const consulta = useConsultaPublica();

const opciones: { valor: TipoTramite; titulo: string; ayuda: string }[] = [
  { valor: 'expediente', titulo: 'Expediente', ayuda: 'Estado de su trámite' },
  { valor: 'licencia', titulo: 'Licencia', ayuda: 'Licencia de funcionamiento' },
  { valor: 'itse', titulo: 'Certificado ITSE', ayuda: 'Seguridad en edificaciones' },
];

const tipo = ref<TipoTramite>('expediente');
const numero = ref('');
const documento = ref('');
const errores = ref<Record<string, string>>({});
const resultados = ref<TramitePublico[] | null>(null);
const aviso = ref<{ tipo: 'info' | 'error'; texto: string } | null>(null);

const etiquetaNumero = computed(() => ({
  expediente: 'Número de expediente',
  licencia: 'Número de licencia',
  itse: 'Número de certificado ITSE',
})[tipo.value]);

const seleccionar = (valor: TipoTramite) => {
  tipo.value = valor;
  resultados.value = null;
  aviso.value = null;
};

/** Mismas reglas que el servidor, para avisar antes de enviar. */
const validar = (): boolean => {
  const e: Record<string, string> = {};
  if (!/^\d+$/.test(numero.value.trim()) || Number(numero.value) < 1) e.numero = 'Ingrese el número usando solo dígitos.';
  if (!/^[0-9A-Za-z]{8,12}$/.test(documento.value.trim())) {
    e.documento = 'Ingrese un DNI (8 dígitos), RUC (11 dígitos) o carné de extranjería válido.';
  }
  errores.value = e;
  return Object.keys(e).length === 0;
};

const consultar = (ev: Event) => {
  ev.preventDefault();
  aviso.value = null;
  resultados.value = null;
  if (!validar()) return;

  consulta.mutate(
    { tipo: tipo.value, numero: Number(numero.value), documento: documento.value.trim() },
    {
      onSuccess: (data) => {
        resultados.value = data;
      },
      onError: (err: any) => {
        const status = err?.response?.status;
        if (status === 422) {
          errores.value = extractFieldErrors(err);
          return;
        }
        aviso.value = {
          tipo: status === 404 ? 'info' : 'error',
          texto: status ? extractErrorMessage(err) : 'No pudimos conectarnos con el sistema. Intente nuevamente en unos minutos.',
        };
      },
    },
  );
};

</script>

<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans text-neutral-800">
    <!-- Encabezado institucional -->
    <header class="bg-[#0B3C5D] text-white">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <img src="/images/escudo-dashboard.png" alt="Escudo municipal" class="h-11 w-auto drop-shadow-xs" />
        <div class="leading-tight">
          <p class="text-[11px] uppercase tracking-widest text-sky-200 font-semibold">Municipalidad Distrital</p>
          <h1 class="text-lg sm:text-xl font-bold">Consulta de trámites</h1>
        </div>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 py-6 sm:py-10 space-y-6">
      <section class="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 sm:p-8">
        <h2 class="text-base sm:text-lg font-bold text-neutral-900">¿Qué desea consultar?</h2>
        <p class="text-xs text-neutral-500 mt-1">
          Ingrese el número de su trámite y el DNI o RUC del titular. No necesita crear una cuenta.
        </p>

        <form class="mt-5 space-y-5" novalidate @submit="consultar">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de trámite">
            <button
              v-for="op in opciones"
              :key="op.valor"
              type="button"
              role="radio"
              :aria-checked="tipo === op.valor"
              :class="[
                'text-left rounded-xl border px-4 py-3 transition-colors cursor-pointer',
                tipo === op.valor
                  ? 'border-[#0B3C5D] bg-sky-50 ring-1 ring-[#0B3C5D]'
                  : 'border-neutral-200 hover:border-neutral-300 bg-white',
              ]"
              @click="seleccionar(op.valor)"
            >
              <span class="block text-sm font-semibold text-neutral-900">{{ op.titulo }}</span>
              <span class="block text-[11px] text-neutral-500">{{ op.ayuda }}</span>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              v-model="numero"
              :label="etiquetaNumero"
              placeholder="Ej. 1250"
              :error="errores.numero"
              :disabled="consulta.isPending.value"
              required
            />
            <Input
              v-model="documento"
              label="DNI o RUC"
              placeholder="8 u 11 dígitos"
              :error="errores.documento"
              :disabled="consulta.isPending.value"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="consulta.isPending.value"
            class="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0B3C5D] hover:bg-[#0d4a73] text-white font-semibold text-sm shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="consulta.isPending.value" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ consulta.isPending.value ? 'Consultando…' : 'Consultar' }}
          </button>
        </form>
      </section>

      <!-- Sin resultados / errores -->
      <div
        v-if="aviso"
        role="status"
        :class="[
          'rounded-2xl border px-5 py-4 text-sm',
          aviso.tipo === 'info' ? 'bg-sky-50 border-sky-200 text-sky-900' : 'bg-red-50 border-red-200 text-red-800',
        ]"
      >
        {{ aviso.texto }}
      </div>

      <!-- Resultados -->
      <section v-if="resultados" class="space-y-4" aria-live="polite">
        <TarjetaTramite v-for="t in resultados" :key="`${t.tipo}-${t.numero}-${t.fecha_emision}`" :tramite="t" />
      </section>

      <p class="text-[11px] text-neutral-500 text-center">
        Por su seguridad, solo se muestran datos del trámite: sus datos personales no se publican.
      </p>
      <section class="bg-white rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-700 flex flex-col sm:flex-row sm:items-center gap-3">
        <p class="flex-1">
          <span class="font-semibold text-neutral-900">¿Quiere ver todos sus trámites juntos?</span>
          Cree su cuenta con su DNI o RUC y el número de uno de sus expedientes.
        </p>
        <router-link
          to="/ciudadano/ingresar"
          class="shrink-0 inline-flex items-center justify-center h-10 px-4 rounded-xl border border-[#0B3C5D] text-[#0B3C5D] font-semibold hover:bg-sky-50"
        >
          Mis trámites
        </router-link>
      </section>
      <p class="text-center">
        <router-link to="/login" class="text-xs font-semibold text-[#0B3C5D] hover:underline">
          Acceso para personal municipal
        </router-link>
      </p>
    </main>
  </div>
</template>
