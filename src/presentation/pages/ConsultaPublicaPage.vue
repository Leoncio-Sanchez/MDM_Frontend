<script setup lang="ts">
import { computed, ref } from 'vue';
import Input from '../components/atoms/Input.vue';
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

const titulo = (t: TramitePublico) => ({
  expediente: `Expediente N.° ${t.numero}`,
  licencia: `Licencia de Funcionamiento N.° ${t.numero}`,
  itse: `Certificado ITSE N.° ${t.numero}`,
})[t.tipo];

/** "2026-01-15" → "15/01/2026" (sin pasar por Date para evitar el desfase de zona horaria) */
const fecha = (valor: string | null) => (valor ? valor.split('-').reverse().join('/') : '—');

const fechas = (t: TramitePublico) => {
  if (t.tipo === 'expediente') {
    return [
      { etiqueta: 'Fecha de ingreso', valor: fecha(t.fecha_emision) },
      { etiqueta: 'Fecha límite de atención', valor: fecha(t.fecha_vencimiento) },
    ];
  }
  return [
    { etiqueta: t.tipo === 'itse' ? 'Fecha de expedición' : 'Fecha de emisión', valor: fecha(t.fecha_emision) },
    { etiqueta: 'Vence', valor: t.vigencia_indeterminada ? 'Vigencia indeterminada' : fecha(t.fecha_vencimiento) },
  ];
};

const colorEstado: Record<TramitePublico['estado'], string> = {
  'EN TRÁMITE': 'bg-amber-50 text-amber-800 border-amber-200',
  ATENDIDO: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  VIGENTE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  IMPROCEDENTE: 'bg-red-50 text-red-800 border-red-200',
  VENCIDO: 'bg-red-50 text-red-800 border-red-200',
  INACTIVO: 'bg-neutral-100 text-neutral-700 border-neutral-300',
};

const explicacion: Record<TramitePublico['estado'], string> = {
  'EN TRÁMITE': 'Su trámite está siendo evaluado por la municipalidad.',
  ATENDIDO: 'Su trámite ya fue atendido.',
  IMPROCEDENTE: 'Su solicitud fue declarada improcedente. Acérquese a la municipalidad para más información.',
  VIGENTE: 'El documento se encuentra vigente.',
  VENCIDO: 'El documento venció. Debe solicitar su renovación.',
  INACTIVO: 'El documento no se encuentra activo. Acérquese a la municipalidad para más información.',
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
        <article
          v-for="t in resultados"
          :key="`${t.tipo}-${t.numero}-${t.fecha_emision}`"
          class="bg-white rounded-2xl border border-neutral-200 shadow-xs p-5 sm:p-6"
        >
          <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 class="text-base font-bold text-neutral-900">{{ titulo(t) }}</h3>
              <p v-if="t.nombre_comercial" class="text-sm text-neutral-600 mt-0.5">{{ t.nombre_comercial }}</p>
              <p v-if="t.procedimiento" class="text-sm text-neutral-600 mt-0.5">{{ t.procedimiento }}</p>
            </div>
            <span :class="['self-start shrink-0 px-3 py-1 rounded-full border text-xs font-bold tracking-wide', colorEstado[t.estado]]">
              {{ t.estado }}
            </span>
          </div>

          <p class="text-sm text-neutral-600 mt-3">{{ explicacion[t.estado] }}</p>

          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-neutral-100">
            <div v-for="f in fechas(t)" :key="f.etiqueta">
              <dt class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">{{ f.etiqueta }}</dt>
              <dd class="text-sm font-medium text-neutral-900">{{ f.valor }}</dd>
            </div>
            <div v-if="t.giros.length" class="sm:col-span-2">
              <dt class="text-[11px] uppercase tracking-wide text-neutral-500 font-semibold">Giro comercial</dt>
              <dd class="text-sm text-neutral-900">{{ t.giros.join(' · ') }}</dd>
            </div>
          </dl>
        </article>
      </section>

      <p class="text-[11px] text-neutral-500 text-center">
        Por su seguridad, solo se muestran datos del trámite: sus datos personales no se publican.
      </p>
      <p class="text-center">
        <router-link to="/login" class="text-xs font-semibold text-[#0B3C5D] hover:underline">
          Acceso para personal municipal
        </router-link>
      </p>
    </main>
  </div>
</template>
