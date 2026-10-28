<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import Skeleton from '../components/atoms/Skeleton.vue';
import { useResumenGeneral } from '../../application/composables/useDashboard';
import type { Permiso } from '../../domain/entities/User.entity';

const authStore = useAuthStore();
const user = computed(() => authStore.user);

// ── Indicadores: cifras generales para todo el personal ─────────────
// Los totales no revelan datos de nadie, así que se muestran a todos; el enlace
// al listado (detalle fila por fila) solo aparece si el perfil tiene ese acceso.
const { data: resumen, isLoading: cargando, isError: error } = useResumenGeneral();

interface Tarjeta {
  titulo: string;
  ruta: string;
  permiso: Permiso;
  valor: number | undefined;
  descripcion: string;
  alerta?: string;
  color: 'blue' | 'emerald' | 'amber';
  icono: string;
}

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

const tarjetas = computed<Tarjeta[]>(() => {
  const r = resumen.value;
  const avisos = (partes: (string | false)[]) => partes.filter(Boolean).join(' · ') || undefined;

  return [
    {
      titulo: 'Trámites TUPA',
      ruta: '/admin/expedientes',
      permiso: 'expedientes',
      valor: r?.expedientes.en_tramite,
      descripcion: 'Expedientes en trámite',
      alerta: r && avisos([
        r.expedientes.por_vencer > 0 && `${r.expedientes.por_vencer} por vencer`,
        r.expedientes.vencidos > 0 && plural(r.expedientes.vencidos, 'vencido', 'vencidos'),
      ]),
      color: 'blue',
      icono: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
    },
    {
      titulo: 'Certificados ITSE',
      ruta: '/admin/itse',
      permiso: 'itse',
      valor: r?.itse.vigentes,
      descripcion: r ? `Vigentes · ${plural(r.itse.emitidos_mes, 'emitido', 'emitidos')} este mes` : 'Vigentes',
      alerta: r && r.itse.por_vencer > 0 ? `${r.itse.por_vencer} vencen en ${r.itse.dias_alerta} días` : undefined,
      color: 'emerald',
      icono: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    },
    {
      titulo: 'Licencias de Funcionamiento',
      ruta: '/admin/licencias-funcionamiento',
      permiso: 'licencias',
      valor: r?.licencias.vigentes,
      descripcion: r
        ? `Vigentes de ${r.licencias.total} · ${plural(r.licencias.emitidas_mes, 'emitida', 'emitidas')} este mes`
        : 'Vigentes',
      color: 'amber',
      icono: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    },
  ];
});

const estilos = {
  blue: { icono: 'bg-blue-50 text-[#0d6efd] border-blue-100 dark:text-blue-400', enlace: 'text-[#0d6efd] bg-blue-50 border-blue-100 dark:text-blue-400' },
  emerald: { icono: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:text-emerald-400', enlace: 'text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400' },
  amber: { icono: 'bg-amber-50 text-amber-600 border-amber-100 dark:text-amber-400', enlace: 'text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400' },
} as const;

/** Valor de la tarjeta; "—" si falló la consulta (mientras carga se muestra un skeleton) */
const valor = (n: number | undefined) => (error.value || n === undefined ? '—' : String(n));

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

    <!-- Tarjetas: cifras para todo el personal; enlace al listado solo con el acceso del módulo -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5" :aria-busy="cargando">
      <component
        :is="authStore.puede([t.permiso]) ? 'router-link' : 'div'"
        v-for="t in tarjetas"
        :key="t.titulo"
        :to="authStore.puede([t.permiso]) ? t.ruta : undefined"
        :class="[
          'bg-white dark:bg-[#18181b] p-6 rounded-2xl shadow-xs border border-neutral-200 dark:border-neutral-800 transition-all group block',
          authStore.puede([t.permiso]) ? 'hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm' : '',
        ]"
      >
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{{ t.titulo }}</span>
          <div :class="['w-9 h-9 rounded-xl dark:bg-neutral-800 shadow-2xs border dark:border-neutral-700 flex items-center justify-center group-hover:scale-105 transition-transform', estilos[t.color].icono]">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" :d="t.icono" />
            </svg>
          </div>
        </div>
        <Skeleton v-if="cargando" class="h-9 w-16 mt-4" rounded="lg" />
        <p v-else class="text-3xl font-extrabold text-neutral-900 dark:text-white mt-4 tracking-tight">{{ valor(t.valor) }}</p>
        <div class="flex items-end justify-between gap-2 mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <Skeleton v-if="cargando" class="h-3 w-32" />
          <span v-else class="text-neutral-500 dark:text-neutral-400">
            {{ t.descripcion }}
            <span v-if="t.alerta" class="block text-amber-600 dark:text-amber-400 font-semibold mt-0.5">{{ t.alerta }}</span>
          </span>
          <span
            v-if="authStore.puede([t.permiso])"
            :class="['shrink-0 font-medium dark:bg-neutral-800 border dark:border-neutral-700 px-2 py-0.5 rounded-md shadow-2xs', estilos[t.color].enlace]"
          >Ver listado →</span>
        </div>
      </component>
    </div>
  </div>
</template>
