<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import LargeModal from '../molecules/LargeModal.vue';
import { useDenegarAutorizacion } from '../../../application/composables/useExpedientes';
import { useDialog, useToast, extractErrorMessage } from '../../../infrastructure/store/useNotificationStore';
import { hoyISO } from '../../utils/fechas';
import type { TipoDenegatoria } from '../../../domain/entities/Expedientes.entity';

/**
 * Registra la denegatoria de la ITSE o de la licencia: la respuesta final desfavorable al
 * solicitante. No se borra ni se repite, por eso se pide confirmación antes de enviarla.
 */
const props = defineProps<{
  /** null = cerrado */
  expediente: { id: number; numero: number | string } | null;
  /** Lo que este usuario puede denegar en este expediente (según sus accesos y lo pendiente) */
  tipos: TipoDenegatoria[];
  /** Ej. desde el acta Desaprobada */
  observacionesSugeridas?: string;
}>();
const emit = defineEmits<{ close: [] }>();

const NOMBRE: Record<TipoDenegatoria, string> = { ITSE: 'ITSE', LF: 'licencia de funcionamiento' };
const OBSERVACIONES_MINIMO = 10;

const toast = useToast();
const dialog = useDialog();
const denegar = useDenegarAutorizacion();

const form = ref({ tipo: 'ITSE' as TipoDenegatoria, fecha_rechazo: '', documento: '', observaciones: '' });
const errores = ref<Record<string, string>>({});

const abierto = computed({
  get: () => props.expediente !== null,
  set: (valor: boolean) => {
    if (!valor) emit('close');
  },
});

// Por id: el padre puede pasar un objeto nuevo en cada render y no debe borrar lo escrito
watch(
  () => props.expediente?.id ?? null,
  (id) => {
    if (id === null) return;
    form.value = {
      tipo: props.tipos[0] ?? 'ITSE',
      fecha_rechazo: hoyISO(),
      documento: '',
      observaciones: props.observacionesSugeridas ?? '',
    };
    errores.value = {};
  },
  { immediate: true },
);

/** El backend responde 400 con { campo: [mensajes] } en este endpoint */
const erroresDelServidor = (err: unknown): Record<string, string> => {
  const data = (err as { response?: { status?: number; data?: unknown } })?.response;
  if (data?.status !== 400 || !data.data || typeof data.data !== 'object') return {};
  return Object.fromEntries(
    Object.entries(data.data as Record<string, unknown>)
      .filter(([, msgs]) => Array.isArray(msgs))
      .map(([campo, msgs]) => [campo, String((msgs as unknown[])[0])]),
  );
};

const registrar = async () => {
  const expediente = props.expediente;
  if (!expediente) return;
  errores.value = {};
  const f = form.value;
  if (!f.fecha_rechazo) errores.value.fecha_rechazo = 'Indique la fecha de la resolución.';
  else if (f.fecha_rechazo > hoyISO()) errores.value.fecha_rechazo = 'La fecha no puede ser posterior a hoy.';
  if (!f.documento.trim()) errores.value.documento = 'Indique la resolución que sustenta la denegatoria.';
  if (f.observaciones.trim().length < OBSERVACIONES_MINIMO)
    errores.value.observaciones = `Explique el motivo (al menos ${OBSERVACIONES_MINIMO} caracteres).`;
  if (Object.keys(errores.value).length) return;

  const ok = await dialog.confirm({
    title: `¿Denegar la ${NOMBRE[f.tipo]}?`,
    text: `Expediente N° ${expediente.numero}. La denegatoria es la respuesta final: no se puede deshacer ni registrar otra vez.`,
    confirmText: 'Sí, registrar denegatoria',
  });
  if (!ok) return;

  try {
    await denegar.mutateAsync({
      id: expediente.id,
      tipo: f.tipo,
      datos: { fecha_rechazo: f.fecha_rechazo, documento: f.documento.trim(), observaciones: f.observaciones.trim() },
    });
    toast.success(`Se registró la denegatoria de la ${NOMBRE[f.tipo]}.`, `Expediente N° ${expediente.numero}`);
    emit('close');
  } catch (err) {
    errores.value = erroresDelServidor(err);
    if (!Object.keys(errores.value).length) errores.value = { general: extractErrorMessage(err, 'No se pudo registrar la denegatoria.') };
  }
};

const claseCampo = (campo: string) => [
  'w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200',
  errores.value[campo] ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700',
];
const claseEtiqueta = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
</script>

<template>
  <LargeModal
    v-model="abierto"
    :title="`Registrar denegatoria · Expediente N° ${expediente?.numero ?? ''}`"
    subtitle="Respuesta final desfavorable al solicitante. Queda registrada con la resolución, la fecha y quién la registró."
    max-width="max-w-xl"
    :is-loading="denegar.isPending.value"
    submit-text="Registrar denegatoria"
    :guarda-borrador="false"
    @submit="registrar"
  >
    <div v-if="errores.general" role="alert" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl">
      {{ errores.general }}
    </div>

    <fieldset v-if="tipos.length > 1">
      <legend :class="claseEtiqueta">Qué se deniega <span class="text-red-500">*</span></legend>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="t in tipos"
          :key="t"
          :class="[
            'flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer',
            form.tipo === t ? 'border-[#0d6efd] bg-blue-50/70 dark:bg-blue-950/30' : 'border-neutral-200 dark:border-neutral-700',
          ]"
        >
          <input v-model="form.tipo" type="radio" name="tipo-denegatoria" :value="t" class="accent-[#0d6efd]" />
          {{ t === 'ITSE' ? 'ITSE' : 'Licencia de funcionamiento' }}
        </label>
      </div>
    </fieldset>
    <p v-else class="text-sm">
      Se deniega: <span class="font-semibold">{{ form.tipo === 'ITSE' ? 'la ITSE' : 'la licencia de funcionamiento' }}</span>
    </p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label for="deneg-documento" :class="claseEtiqueta">Resolución <span class="text-red-500">*</span></label>
        <input
          id="deneg-documento"
          v-model="form.documento"
          type="text"
          maxlength="100"
          placeholder="Ej. RES. GERENCIAL N° 045-2026-GDE"
          :aria-invalid="!!errores.documento"
          :class="claseCampo('documento')"
        />
        <p v-if="errores.documento" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errores.documento }}</p>
      </div>
      <div>
        <label for="deneg-fecha" :class="claseEtiqueta">Fecha de la resolución <span class="text-red-500">*</span></label>
        <input
          id="deneg-fecha"
          v-model="form.fecha_rechazo"
          type="date"
          :max="hoyISO()"
          :aria-invalid="!!errores.fecha_rechazo"
          :class="claseCampo('fecha_rechazo')"
        />
        <p v-if="errores.fecha_rechazo" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errores.fecha_rechazo }}</p>
      </div>
    </div>

    <div>
      <label for="deneg-observaciones" :class="claseEtiqueta">Motivo <span class="text-red-500">*</span></label>
      <textarea
        id="deneg-observaciones"
        v-model="form.observaciones"
        rows="4"
        maxlength="1000"
        placeholder="Ej. En la reinspección no se subsanaron las observaciones del acta N° 012-2026."
        :aria-invalid="!!errores.observaciones"
        :class="[claseCampo('observaciones'), 'resize-none']"
      />
      <p v-if="errores.observaciones" class="text-xs text-red-600 dark:text-red-400 mt-1">{{ errores.observaciones }}</p>
    </div>

    <p class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
      El expediente deja de esperar esta autorización y aparece en el reporte de denegadas. La denegatoria no se puede deshacer.
    </p>
  </LargeModal>
</template>
