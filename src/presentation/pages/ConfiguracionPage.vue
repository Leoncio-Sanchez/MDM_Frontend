<script setup lang="ts">
/**
 * Datos institucionales de los informes formales: encabezado (entidad, nombre del año, gerencia),
 * siglas del número de informe y pie de firma. El nombre del año cambia cada enero.
 */
import { computed, reactive, ref, watch } from 'vue';
import Skeleton from '../components/atoms/Skeleton.vue';
import { useConfiguracionInforme, useGuardarConfiguracionInforme } from '../../application/composables/useConfiguracion';
import { extractErrorMessage, extractFieldErrors, useToast } from '../../infrastructure/store/useNotificationStore';
import type { ConfiguracionInforme } from '../../domain/entities/Configuracion.entity';

const config = useConfiguracionInforme();
const guardar = useGuardarConfiguracionInforme();
const toast = useToast();

const form = reactive<ConfiguracionInforme>({
  entidad: '',
  nombre_anio: '',
  gerencia: '',
  siglas: '',
  firmante_nombre: '',
  firmante_cargo: '',
});
const errores = ref<Record<string, string>>({});

watch(
  () => config.data.value,
  (datos) => {
    if (datos) Object.assign(form, datos);
  },
  { immediate: true },
);

const hayCambios = computed(() =>
  config.data.value ? (Object.keys(form) as (keyof ConfiguracionInforme)[]).some((k) => form[k] !== config.data.value![k]) : false,
);

/** Vista previa del número tal como saldrá impreso */
const ejemploNumero = computed(() => `001-${new Date().getFullYear()}-${form.siglas || '…'}`);

const campos: { clave: keyof ConfiguracionInforme; etiqueta: string; ayuda?: string; max: number; obligatorio: boolean }[] = [
  { clave: 'entidad', etiqueta: 'Entidad', max: 200, obligatorio: true },
  { clave: 'nombre_anio', etiqueta: 'Nombre oficial del año', ayuda: 'Se imprime entre comillas debajo de la entidad. Actualícelo cada enero; si queda vacío, no se imprime.', max: 250, obligatorio: false },
  { clave: 'gerencia', etiqueta: 'Gerencia', max: 200, obligatorio: true },
  { clave: 'siglas', etiqueta: 'Siglas del informe', ayuda: 'Mayúsculas, números, "/" y "-". Va al final del número del informe.', max: 40, obligatorio: true },
  { clave: 'firmante_nombre', etiqueta: 'Nombre de quien firma', ayuda: 'Si queda vacío, se deja una línea para escribirlo a mano.', max: 150, obligatorio: false },
  { clave: 'firmante_cargo', etiqueta: 'Cargo de quien firma', max: 150, obligatorio: true },
];

const enviar = async () => {
  errores.value = {};
  try {
    await guardar.mutateAsync({ ...form, siglas: form.siglas.trim().toUpperCase() });
    toast.success('Los próximos informes usarán estos datos.', 'Configuración guardada');
  } catch (err) {
    errores.value = extractFieldErrors(err);
    if (!Object.keys(errores.value).length) toast.error(extractErrorMessage(err, 'No se pudo guardar la configuración.'));
  }
};

const restaurar = () => {
  if (config.data.value) Object.assign(form, config.data.value);
  errores.value = {};
};

const tarjeta = 'bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-5';
const claseInput = (clave: string) => [
  'block w-full mt-1 h-10 px-3 rounded-lg border bg-white dark:bg-[#18181b] text-sm text-neutral-900 dark:text-white',
  errores.value[clave] ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700',
];
</script>

<template>
  <div class="space-y-4 max-w-3xl">
    <div>
      <h1 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">Configuración de informes</h1>
      <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Encabezado y firma que se imprimen en los informes formales en PDF.</p>
    </div>

    <p v-if="config.isError.value" role="alert" class="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-sm text-red-700 dark:text-red-300">
      No se pudo cargar la configuración: {{ extractErrorMessage(config.error.value) }}
    </p>

    <form v-else :class="[tarjeta, 'space-y-4']" novalidate @submit.prevent="enviar">
      <template v-if="config.isLoading.value">
        <div v-for="c in campos" :key="c.clave">
          <Skeleton class="h-3 w-32" rounded="md" />
          <Skeleton class="h-10 w-full mt-2" rounded="lg" />
        </div>
      </template>

      <template v-else>
        <label v-for="c in campos" :key="c.clave" class="block text-xs font-semibold text-neutral-700 dark:text-neutral-200">
          {{ c.etiqueta }}<span v-if="c.obligatorio" class="text-red-500"> *</span>
          <input
            v-model="form[c.clave]"
            type="text"
            :maxlength="c.max"
            :class="[claseInput(c.clave), c.clave === 'siglas' ? 'uppercase' : '']"
            :aria-invalid="!!errores[c.clave]"
          />
          <span v-if="errores[c.clave]" class="block mt-1 font-normal text-red-600 dark:text-red-400">{{ errores[c.clave] }}</span>
          <span v-else-if="c.ayuda" class="block mt-1 font-normal text-neutral-500 dark:text-neutral-400">{{ c.ayuda }}</span>
        </label>

        <p class="text-xs text-neutral-600 dark:text-neutral-300">
          Así saldrá el número: <strong class="text-neutral-900 dark:text-white">INFORME N° {{ ejemploNumero.toUpperCase() }}</strong>
        </p>

        <div class="flex flex-wrap justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <button
            type="button"
            class="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!hayCambios || guardar.isPending.value"
            @click="restaurar"
          >
            Deshacer cambios
          </button>
          <button
            type="submit"
            class="px-4 py-2 rounded-xl bg-[#0d6efd] hover:bg-blue-700 text-white text-sm font-semibold shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!hayCambios || guardar.isPending.value"
          >
            {{ guardar.isPending.value ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </template>
    </form>
  </div>
</template>
