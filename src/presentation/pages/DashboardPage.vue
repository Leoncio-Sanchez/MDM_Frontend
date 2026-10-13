<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import Skeleton from '../components/atoms/Skeleton.vue';
import { useExpedientesPendientes } from '../../application/composables/useExpedientes';
import { useItseList } from '../../application/composables/useItse';
import { useLicenciasFuncionamientoList } from '../../application/composables/useLicenciasFuncionamiento';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// ── Indicadores (datos reales de la API) ────────────────────────────
const DIAS_ALERTA_ITSE = 30;

// Cada tarjeta (y su consulta) solo aparece si el perfil tiene ese acceso
const verTramites = computed(() => authStore.puede(['expedientes']));
const verItse = computed(() => authStore.puede(['itse']));
const verLicencias = computed(() => authStore.puede(['licencias']));
const sinIndicadores = computed(() => !verTramites.value && !verItse.value && !verLicencias.value);

const { data: pendientesData, isLoading: cargandoPendientes, isError: errorPendientes } = useExpedientesPendientes(verTramites);
const { data: itseData, isLoading: cargandoItse, isError: errorItse } = useItseList(verItse);
const { data: licenciasData, isLoading: cargandoLicencias, isError: errorLicencias } = useLicenciasFuncionamientoList(verLicencias);

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const tramites = computed(() => {
  const pendientes = listOf<{ mostrar_alerta: boolean }>(pendientesData.value);
  return { total: pendientes.length, porVencer: pendientes.filter((p) => p.mostrar_alerta).length };
});

const itse = computed(() => {
  const hoy = hoyISO();
  const limite = new Date();
  limite.setDate(limite.getDate() + DIAS_ALERTA_ITSE);
  const vigentes = listOf<{ fecha_caducidad: string; historial_estados?: unknown[] }>(itseData.value).filter(
    (i) => !i.historial_estados?.length && i.fecha_caducidad >= hoy,
  );
  return { vigentes: vigentes.length, porVencer: vigentes.filter((i) => new Date(i.fecha_caducidad) <= limite).length };
});

const licencias = computed(() => {
  const todas = listOf<{ historial_estados?: unknown[] }>(licenciasData.value);
  return { emitidas: todas.length, vigentes: todas.filter((l) => !l.historial_estados?.length).length };
});

/** Valor de la tarjeta; "—" si falló la consulta (mientras carga se muestra un skeleton) */
const valor = (error: boolean, n: number) => (error ? '—' : String(n));

const todayFormatted = computed(() => {
  return new Intl.DateTimeFormat('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());
});

const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'ADMIN_MUNICIPALIDAD':
      return 'Administrador Municipal';
    case 'INSPECTOR':
      return 'Inspector Técnico ITSE';
    case 'CIUDADANO':
      return 'Administrado / Ciudadano';
    case 'EMPRESA':
      return 'Representante Legal';
    default:
      return user.value?.role || 'Usuario';
  }
});
</script>

<template>
  <div class="space-y-6">
    <!-- Banner de Bienvenida: Card White sobre Canvas #f4f4f4 -->
    <div class="relative overflow-hidden rounded-2xl bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-neutral-800 p-6 sm:p-7 shadow-xs select-none transition-colors">
      <div class="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div class="space-y-2">
          <!-- Tag / Badge institucional superior -->
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[11px] font-bold text-[#0d6efd] dark:text-blue-400 tracking-wide uppercase shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full bg-[#0d6efd] dark:bg-blue-400"></span>
            Plataforma Digital Municipal · LF & ITSE
          </div>

          <!-- Título con Negro Profundo y Azul Bootstrap Primary #0d6efd -->
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Bienvenido al Sistema <span class="text-[#0d6efd] dark:text-blue-400">MUNI_APP</span>
          </h1>

          <!-- Metadatos de sesión en chips claros -->
          <div class="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 flex-wrap pt-0.5">
            <span>Sesión activa como</span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-mono text-xs font-semibold shadow-2xs">
              {{ roleLabel }}
            </span>
            <span class="text-neutral-400 dark:text-neutral-600">·</span>
            <span class="text-neutral-700 dark:text-neutral-300 font-medium font-mono text-xs">@{{ user?.username }}</span>
          </div>
        </div>

        <!-- Indicadores de Estado y Fecha -->
        <div class="flex items-center gap-3 shrink-0 flex-wrap">
          <!-- Fecha del día -->
          <div class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 shadow-2xs">
            <svg class="w-4 h-4 text-[#0d6efd] dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="capitalize">{{ todayFormatted }}</span>
          </div>

          <!-- Badge de Servicios en Línea -->
          <div class="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-2xs">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Servicios en línea</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tarjetas de Métricas: Cards con Iconos y Estados -->
    <p
      v-if="sinIndicadores"
      class="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-6 text-sm text-neutral-500 dark:text-neutral-400"
    >
      Su perfil no incluye Expedientes, Licencias ni ITSE. Use el menú lateral para acceder a sus opciones.
    </p>
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-5" :aria-busy="cargandoPendientes || cargandoItse || cargandoLicencias">
      <!-- Trámites TUPA -->
      <router-link 
        v-if="verTramites"
        to="/admin/expedientes" 
        class="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xs border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all group block"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Trámites TUPA</span>
          <div class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-neutral-800 text-[#0d6efd] dark:text-blue-400 shadow-2xs border border-blue-100 dark:border-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
        </div>
        <Skeleton v-if="cargandoPendientes" class="h-9 w-16 mt-4" rounded="lg" />
        <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-4 tracking-tight">{{ valor(errorPendientes, tramites.total) }}</p>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <Skeleton v-if="cargandoPendientes" class="h-3 w-32" />
          <span v-else class="text-neutral-500 dark:text-neutral-400">
            Expedientes en trámite
            <span v-if="tramites.porVencer" class="text-amber-600 dark:text-amber-400 font-semibold">· {{ tramites.porVencer }} por vencer</span>
          </span>
          <span class="font-medium text-[#0d6efd] dark:text-blue-400 bg-blue-50 dark:bg-neutral-800 border border-blue-100 dark:border-neutral-700 px-2 py-0.5 rounded-md shadow-2xs">Ver listado →</span>
        </div>
      </router-link>

      <!-- Inspecciones ITSE -->
      <router-link 
        v-if="verItse"
        to="/admin/itse" 
        class="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xs border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all group block"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Inspecciones ITSE</span>
          <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-neutral-800 text-emerald-600 dark:text-emerald-400 shadow-2xs border border-emerald-100 dark:border-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        <Skeleton v-if="cargandoItse" class="h-9 w-16 mt-4" rounded="lg" />
        <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-4 tracking-tight">{{ valor(errorItse, itse.vigentes) }}</p>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <Skeleton v-if="cargandoItse" class="h-3 w-32" />
          <span v-else class="text-neutral-500 dark:text-neutral-400">
            Certificados vigentes
            <span v-if="itse.porVencer" class="text-amber-600 dark:text-amber-400 font-semibold">· {{ itse.porVencer }} por vencer</span>
          </span>
          <span class="font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-neutral-800 border border-emerald-100 dark:border-neutral-700 px-2 py-0.5 rounded-md shadow-2xs">Ver listado →</span>
        </div>
      </router-link>

      <!-- Licencias Vigentes -->
      <router-link 
        v-if="verLicencias"
        to="/admin/licencias-funcionamiento" 
        class="bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xs border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all group block"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Licencias Vigentes</span>
          <div class="w-9 h-9 rounded-xl bg-amber-50 dark:bg-neutral-800 text-amber-600 dark:text-amber-400 shadow-2xs border border-amber-100 dark:border-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <Skeleton v-if="cargandoLicencias" class="h-9 w-16 mt-4" rounded="lg" />
        <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-4 tracking-tight">{{ valor(errorLicencias, licencias.vigentes) }}</p>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <Skeleton v-if="cargandoLicencias" class="h-3 w-32" />
          <span v-else class="text-neutral-500 dark:text-neutral-400">De {{ licencias.emitidas }} emitidas en total</span>
          <span class="font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-neutral-800 border border-amber-100 dark:border-neutral-700 px-2 py-0.5 rounded-md shadow-2xs">Ver catálogo →</span>
        </div>
      </router-link>
    </div>
  </div>
</template>
