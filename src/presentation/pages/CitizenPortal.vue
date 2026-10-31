<script setup lang="ts">
import { computed } from 'vue';
import { useMisTramites } from '../../application/composables/useConsultaPublica';
import { extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import TarjetaTramite from '../components/organisms/TarjetaTramite.vue';
import Skeleton from '../components/atoms/Skeleton.vue';

/**
 * "Mis trámites": todo lo que está a nombre del documento de la cuenta del ciudadano
 * (expedientes, licencias y certificados ITSE), con el avance de la inspección.
 */
const { data, isLoading, isError, error } = useMisTramites();

const secciones = computed(() => {
  const d = data.value;
  if (!d) return [];
  return [
    { id: 'expedientes', titulo: 'Expedientes', ayuda: 'Solicitudes presentadas en mesa de partes', items: d.expedientes },
    { id: 'licencias', titulo: 'Licencias de funcionamiento', ayuda: '', items: d.licencias },
    { id: 'itse', titulo: 'Certificados ITSE', ayuda: 'Inspección técnica de seguridad en edificaciones', items: d.itse },
  ].filter((s) => s.items.length > 0);
});

/** Lo urgente primero: inspecciones observadas (con plazo para subsanar) o programadas */
const avisos = computed(() =>
  (data.value?.expedientes ?? []).filter((e) => e.inspeccion?.estado === 'OBSERVADA' || e.inspeccion?.estado === 'PROGRAMADA'),
);
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-5">
    <section class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5 sm:p-6">
      <h1 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Mis trámites</h1>
      <p class="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
        Trámites a nombre del {{ data?.documento && data.documento.length === 11 ? 'RUC' : 'DNI' }}
        <span v-if="data?.documento" class="font-semibold">{{ data.documento }}</span>: expedientes, licencias y certificados ITSE.
      </p>
      <p v-if="avisos.length" class="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
        Tiene {{ avisos.length === 1 ? 'una inspección' : `${avisos.length} inspecciones` }} que requiere{{ avisos.length === 1 ? '' : 'n' }} su atención: revise los detalles abajo.
      </p>
    </section>

    <div v-if="isLoading" class="space-y-3" role="status" aria-label="Cargando sus trámites">
      <Skeleton v-for="n in 2" :key="n" class="h-40 w-full rounded-2xl" />
    </div>

    <div
      v-else-if="isError"
      role="alert"
      class="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800"
    >
      No pudimos cargar sus trámites: {{ extractErrorMessage(error) }}
    </div>

    <div
      v-else-if="!data?.documento"
      class="rounded-2xl border border-neutral-200 bg-white dark:bg-[#18181b] dark:border-neutral-800 px-5 py-6 text-sm text-neutral-700 dark:text-neutral-300"
    >
      Su cuenta no está vinculada a un DNI o RUC. Si es ciudadano, cree su cuenta desde
      <router-link to="/consulta" class="font-semibold text-[#0d6efd] hover:underline">la consulta de trámites</router-link>;
      si es personal de la municipalidad, pida al administrador que habilite su acceso.
    </div>

    <div
      v-else-if="!secciones.length"
      class="rounded-2xl border border-neutral-200 bg-white dark:bg-[#18181b] dark:border-neutral-800 px-5 py-6 text-sm text-neutral-700 dark:text-neutral-300"
    >
      No encontramos trámites a su nombre.
    </div>

    <section v-for="s in secciones" v-else :key="s.id" class="space-y-3" :aria-labelledby="`sec-${s.id}`">
      <div>
        <h2 :id="`sec-${s.id}`" class="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
          {{ s.titulo }} ({{ s.items.length }})
        </h2>
        <p v-if="s.ayuda" class="text-xs text-neutral-500 dark:text-neutral-400">{{ s.ayuda }}</p>
      </div>
      <TarjetaTramite v-for="t in s.items" :key="`${t.tipo}-${t.numero}-${t.fecha_emision}`" :tramite="t" sigue-tema />
    </section>

    <p class="text-[11px] text-center text-neutral-500 dark:text-neutral-400">
      Si un trámite suyo no aparece, acérquese a mesa de partes con su DNI: puede estar registrado con otro documento.
    </p>
  </div>
</template>
