<script setup lang="ts">
/** Periodo de un reporte: atajos (este mes, mes anterior, este año) o un rango a mano. */
import { computed, ref, watch } from 'vue';
import { rangoAnio, rangoMes, type RangoFechas } from '../../utils/fechas';

const rango = defineModel<RangoFechas>({ required: true });

const desdeInput = ref(rango.value.desde);
const hastaInput = ref(rango.value.hasta);
const error = ref<string | null>(null);

// Si el periodo cambia desde afuera (o con un atajo), las casillas lo reflejan
watch(rango, (r) => {
  desdeInput.value = r.desde;
  hastaInput.value = r.hasta;
});

const atajos = [
  { titulo: 'Este mes', rango: () => rangoMes(0) },
  { titulo: 'Mes anterior', rango: () => rangoMes(-1) },
  { titulo: 'Este año', rango: rangoAnio },
];
const esIgual = (a: RangoFechas, b: RangoFechas) => a.desde === b.desde && a.hasta === b.hasta;
const atajoActivo = computed(() => atajos.find((a) => esIgual(a.rango(), rango.value))?.titulo ?? null);

const elegir = (nuevo: RangoFechas) => {
  error.value = null;
  rango.value = nuevo;
};

const aplicar = () => {
  if (!desdeInput.value || !hastaInput.value) return (error.value = 'Indique ambas fechas.');
  if (hastaInput.value < desdeInput.value) return (error.value = 'La fecha de fin no puede ser anterior a la de inicio.');
  elegir({ desde: desdeInput.value, hasta: hastaInput.value });
};

const botonFiltro = (activo: boolean) => [
  'px-3 h-8 rounded-lg text-xs font-semibold border transition-colors cursor-pointer',
  activo
    ? 'border-[#0d6efd] bg-[#0d6efd] text-white'
    : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
];
const claseFecha = 'block mt-1 h-9 px-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#18181b] text-sm';
</script>

<template>
  <div class="flex flex-col gap-1">
    <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
      <div class="flex flex-wrap items-center gap-2">
        <button v-for="a in atajos" :key="a.titulo" type="button" :class="botonFiltro(atajoActivo === a.titulo)" @click="elegir(a.rango())">
          {{ a.titulo }}
        </button>
      </div>
      <div class="flex flex-wrap items-end gap-2">
        <label class="text-xs text-neutral-600 dark:text-neutral-300">
          Desde
          <input v-model="desdeInput" type="date" :class="claseFecha" />
        </label>
        <label class="text-xs text-neutral-600 dark:text-neutral-300">
          Hasta
          <input v-model="hastaInput" type="date" :class="claseFecha" />
        </label>
        <button type="button" :class="botonFiltro(false)" class="h-9" @click="aplicar">Aplicar</button>
      </div>
    </div>
    <p v-if="error" role="alert" class="text-xs text-red-600 dark:text-red-400">{{ error }}</p>
  </div>
</template>
