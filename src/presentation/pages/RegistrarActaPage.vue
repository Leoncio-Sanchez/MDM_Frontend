<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMiBandeja, useRegistrarActa } from '../../application/composables/useInspecciones';
import { useFormDraft } from '../../application/composables/useFormDraft';
import Skeleton from '../components/atoms/Skeleton.vue';
import { useDialog, useToast, extractErrorMessage } from '../../infrastructure/store/useNotificationStore';
import { comprimirImagen } from '../utils/imagenes';
import { formatoFecha } from '../utils/fechas';
import {
  GRUPOS_CHECKLIST,
  PLAZOS_SUBSANACION,
  type EstadoChecklist,
  type GrupoChecklist,
  type ResultadoActa,
  type TipoFotoActa,
} from '../../domain/entities/Inspecciones.entity';

/**
 * El inspector registra en campo el acta de su visita (D.S. N° 002-2018-PCM).
 * El resultado sale del checklist: si algo no cumple, queda Observado en la 1.ª visita
 * y Desaprobado en la reinspección. Una vez enviada, el acta no se puede modificar.
 */
const route = useRoute();
const router = useRouter();
const toast = useToast();
const dialog = useDialog();

const asignacionId = Number(route.params.asignacionId);
const { data: bandeja, isLoading } = useMiBandeja();
const asignacion = computed(() => (bandeja.value ?? []).find((a) => a.id === asignacionId) ?? null);
const visita = computed(() => (asignacion.value?.ultima_acta_resultado === 'OBSERVADO' ? 2 : 1));

// ── Formulario (los textos se guardan como borrador; las fotos no) ─────────
const ahoraLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};

const { form, clearDraft } = useFormDraft({
  key: `acta_${asignacionId}`,
  initialData: {
    numero_acta: '',
    fecha_visita: ahoraLocal(),
    area_m2: '' as string | number,
    aforo: '' as string | number,
    extintores: '' as EstadoChecklist | '',
    senalizacion: '' as EstadoChecklist | '',
    luces_emergencia: '' as EstadoChecklist | '',
    tableros_electricos: '' as EstadoChecklist | '',
    observaciones: '',
    plazo_subsanacion_dias: 3 as number,
  },
});

// Un borrador sin número de acta no tiene nada del usuario: la hora propuesta debe ser la actual
onMounted(() => {
  if (!form.value.numero_acta) form.value.fecha_visita = ahoraLocal();
});

const OPCIONES: { valor: EstadoChecklist; texto: string; activo: string }[] = [
  { valor: 'CUMPLE', texto: 'Cumple', activo: 'border-emerald-600 bg-emerald-600 text-white' },
  { valor: 'NO_CUMPLE', texto: 'No cumple', activo: 'border-red-600 bg-red-600 text-white' },
  { valor: 'NO_APLICA', texto: 'No aplica', activo: 'border-neutral-600 bg-neutral-600 text-white' },
];

const hayIncumplimientos = computed(() => GRUPOS_CHECKLIST.some((g) => form.value[g.clave] === 'NO_CUMPLE'));
const checklistCompleto = computed(() => GRUPOS_CHECKLIST.every((g) => form.value[g.clave] !== ''));
const resultado = computed<ResultadoActa | null>(() => {
  if (!checklistCompleto.value) return null;
  if (!hayIncumplimientos.value) return 'APROBADO';
  return visita.value === 1 ? 'OBSERVADO' : 'DESAPROBADO';
});
const RESULTADO: Record<ResultadoActa, { texto: string; detalle: string; clase: string }> = {
  APROBADO: {
    texto: 'Aprobado',
    detalle: 'El local cumple. La oficina emitirá el certificado ITSE.',
    clase: 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200',
  },
  OBSERVADO: {
    texto: 'Observado',
    detalle: 'El solicitante tiene un plazo para corregir; después corresponde la reinspección.',
    clase: 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200',
  },
  DESAPROBADO: {
    texto: 'Desaprobado',
    detalle: 'No se corrigió lo observado. La oficina registrará la denegatoria de la ITSE.',
    clase: 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200',
  },
};

// Referencia del trigger de aforo del sistema: 2 personas por m²
const aforoMaximo = computed(() => {
  const area = Number(form.value.area_m2);
  return area > 0 ? Math.floor(area * 2) : null;
});
const aforoExcede = computed(() => aforoMaximo.value !== null && Number(form.value.aforo) > aforoMaximo.value);

// ── Fotos ──────────────────────────────────────────────────────────────────
interface FotoElegida {
  tipo: TipoFotoActa;
  archivo: File;
  url: string;
}
const MAXIMO_FOTOS = 10;
const fotos = ref<FotoElegida[]>([]);
const procesandoFoto = ref(false);

const fotosObligatorias = computed(() => {
  const lista: { tipo: TipoFotoActa; nombre: string }[] = [{ tipo: 'FACHADA', nombre: 'Fachada' }];
  if (form.value.extintores !== 'NO_APLICA') lista.push({ tipo: 'EXTINTORES', nombre: 'Extintores' });
  if (form.value.tableros_electricos !== 'NO_APLICA') lista.push({ tipo: 'TABLEROS', nombre: 'Tableros eléctricos' });
  return lista;
});
const fotoDe = (tipo: TipoFotoActa) => fotos.value.find((f) => f.tipo === tipo);
const otrasFotos = computed(() => fotos.value.filter((f) => f.tipo === 'OTRA'));

const elegirFoto = async (tipo: TipoFotoActa, evento: Event) => {
  const input = evento.target as HTMLInputElement;
  const archivo = input.files?.[0];
  input.value = '';
  if (!archivo) return;
  if (!/^image\/(jpeg|png)$/.test(archivo.type)) {
    toast.error('La foto debe ser JPG o PNG.');
    return;
  }
  procesandoFoto.value = true;
  try {
    const reducida = await comprimirImagen(archivo);
    if (tipo !== 'OTRA') quitarFoto(tipo);
    if (fotos.value.length >= MAXIMO_FOTOS) {
      toast.error(`Se permiten como máximo ${MAXIMO_FOTOS} fotos.`);
      return;
    }
    fotos.value.push({ tipo, archivo: reducida, url: URL.createObjectURL(reducida) });
  } finally {
    procesandoFoto.value = false;
  }
};

const quitarFoto = (tipoOFoto: TipoFotoActa | FotoElegida) => {
  const foto = typeof tipoOFoto === 'string' ? fotoDe(tipoOFoto) : tipoOFoto;
  if (!foto) return;
  URL.revokeObjectURL(foto.url);
  fotos.value = fotos.value.filter((f) => f !== foto);
};
onBeforeUnmount(() => fotos.value.forEach((f) => URL.revokeObjectURL(f.url)));

// ── Envío ──────────────────────────────────────────────────────────────────
const registrar = useRegistrarActa();
const progreso = ref(0);
const error = ref<string | null>(null);

const validar = (): string | null => {
  const f = form.value;
  if (!f.numero_acta.trim()) return 'Indique el número de acta.';
  if (!f.fecha_visita) return 'Indique la fecha y hora de la visita.';
  if (new Date(f.fecha_visita) > new Date()) return 'La fecha y hora de la visita no puede ser posterior al momento actual.';
  if (!(Number(f.area_m2) > 0)) return 'Indique el metraje del local (mayor que cero).';
  if (f.aforo === '' || !Number.isInteger(Number(f.aforo)) || Number(f.aforo) < 0) return 'Indique el aforo comprobado (número entero).';
  if (!checklistCompleto.value) return 'Complete los 4 puntos del checklist.';
  if (hayIncumplimientos.value && !f.observaciones.trim()) return 'Detalle las observaciones: hay puntos que no cumplen.';
  const falta = fotosObligatorias.value.find((o) => !fotoDe(o.tipo));
  if (falta) return `Falta la foto de: ${falta.nombre}.`;
  return null;
};

const enviar = async () => {
  error.value = validar();
  if (error.value || !asignacion.value || !resultado.value) return;

  const ok = await dialog.confirm({
    variant: 'warning',
    title: `Registrar acta: ${RESULTADO[resultado.value].texto}`,
    text: 'Revise los datos: una vez registrada, el acta no se puede modificar.',
    confirmText: 'Sí, registrar',
    cancelText: 'Revisar',
  });
  if (!ok) return;

  const f = form.value;
  // Solo las fotos de grupos que aplican (si cambió a "No aplica" después de tomarla)
  const tiposValidos = new Set<TipoFotoActa>(['OTRA', ...fotosObligatorias.value.map((o) => o.tipo)]);
  progreso.value = 0;
  registrar.mutate(
    {
      asignacionId,
      acta: {
        numero_acta: f.numero_acta.trim(),
        fecha_visita: new Date(f.fecha_visita).toISOString(),
        area_m2: Number(f.area_m2),
        aforo: Number(f.aforo),
        extintores: f.extintores as EstadoChecklist,
        senalizacion: f.senalizacion as EstadoChecklist,
        luces_emergencia: f.luces_emergencia as EstadoChecklist,
        tableros_electricos: f.tableros_electricos as EstadoChecklist,
        observaciones: f.observaciones.trim() || null,
        plazo_subsanacion_dias: resultado.value === 'OBSERVADO' ? f.plazo_subsanacion_dias : null,
        fotos: fotos.value.filter((x) => tiposValidos.has(x.tipo)).map(({ tipo, archivo }) => ({ tipo, archivo })),
      },
      onProgreso: (p) => (progreso.value = p),
    },
    {
      onSuccess: (acta) => {
        clearDraft();
        toast.success(`Acta N° ${acta.numero_acta} registrada: ${RESULTADO[acta.resultado].texto.toLowerCase()}.`);
        router.push('/inspector');
      },
      onError: (err) => {
        error.value = extractErrorMessage(err, 'No se pudo registrar el acta');
      },
    },
  );
};

const elegir = (grupo: GrupoChecklist, valor: EstadoChecklist) => {
  form.value[grupo] = valor;
};

const claseCampo =
  'w-full px-3.5 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200';
const claseEtiqueta = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const claseSeccion = 'bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs p-4 sm:p-6 space-y-4';
</script>

<template>
  <div class="space-y-4 max-w-3xl mx-auto">
    <router-link to="/inspector" class="inline-flex items-center gap-1 text-sm font-semibold text-[#0d6efd] dark:text-blue-400 hover:underline">
      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      Mis inspecciones
    </router-link>

    <div v-if="isLoading" class="space-y-3">
      <Skeleton class="h-24 w-full rounded-2xl" />
      <Skeleton class="h-64 w-full rounded-2xl" />
    </div>

    <div v-else-if="!asignacion" class="bg-white dark:bg-[#18181b] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center text-sm text-neutral-600 dark:text-neutral-300">
      Esta inspección ya no está en su bandeja: puede que se haya reasignado o que ya tenga dictamen final.
    </div>

    <form v-else class="space-y-4" novalidate @submit.prevent="enviar">
      <!-- Encabezado -->
      <section :class="claseSeccion">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Expediente N° {{ asignacion.numero_expediente }} · {{ visita === 1 ? '1.ª visita' : 'Reinspección' }}
          </p>
          <h1 class="text-lg font-bold text-neutral-900 dark:text-white mt-1">{{ asignacion.nombre_comercial }}</h1>
          <p class="text-sm text-neutral-700 dark:text-neutral-300">{{ asignacion.direccion }}</p>
        </div>
        <div
          v-if="visita === 2"
          class="text-sm rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 p-3 space-y-1"
        >
          <p class="font-semibold">
            Verifique lo observado en el acta N° {{ asignacion.ultima_acta_numero }}
            <template v-if="asignacion.fecha_limite_subsanacion">(plazo hasta el {{ formatoFecha(asignacion.fecha_limite_subsanacion) }})</template>:
          </p>
          <p class="whitespace-pre-line">{{ asignacion.ultima_acta_observaciones }}</p>
        </div>
      </section>

      <!-- Datos de la visita -->
      <section :class="claseSeccion">
        <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Datos de la visita</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="acta-numero" :class="claseEtiqueta">N° de acta <span class="text-red-500">*</span></label>
            <input id="acta-numero" v-model="form.numero_acta" type="text" maxlength="30" autocomplete="off" :class="claseCampo" placeholder="Ej. 0123-2026" />
          </div>
          <div>
            <label for="acta-fecha" :class="claseEtiqueta">Fecha y hora <span class="text-red-500">*</span></label>
            <input id="acta-fecha" v-model="form.fecha_visita" type="datetime-local" :max="ahoraLocal()" :class="claseCampo" />
          </div>
          <div>
            <label for="acta-area" :class="claseEtiqueta">Metraje (m²) <span class="text-red-500">*</span></label>
            <input id="acta-area" v-model="form.area_m2" type="number" inputmode="decimal" min="0.01" step="0.01" :class="claseCampo" />
          </div>
          <div>
            <label for="acta-aforo" :class="claseEtiqueta">Aforo comprobado <span class="text-red-500">*</span></label>
            <input id="acta-aforo" v-model="form.aforo" type="number" inputmode="numeric" min="0" step="1" :class="claseCampo" />
            <p v-if="aforoMaximo !== null" :class="['text-[11px] mt-1', aforoExcede ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-neutral-500 dark:text-neutral-400']">
              {{ aforoExcede ? 'Supera' : 'Máximo según el área:' }} {{ aforoMaximo }} personas (2 por m²).
            </p>
          </div>
        </div>
      </section>

      <!-- Checklist -->
      <section :class="claseSeccion">
        <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Checklist de seguridad</h2>
        <div v-for="g in GRUPOS_CHECKLIST" :key="g.clave" class="space-y-2">
          <p :id="`grupo-${g.clave}`" class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">{{ g.nombre }}</p>
          <div class="grid grid-cols-3 gap-2" role="radiogroup" :aria-labelledby="`grupo-${g.clave}`">
            <button
              v-for="o in OPCIONES"
              :key="o.valor"
              type="button"
              role="radio"
              :aria-checked="form[g.clave] === o.valor"
              :class="[
                'h-11 rounded-xl border text-sm font-semibold transition-colors cursor-pointer',
                form[g.clave] === o.valor
                  ? o.activo
                  : 'border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 bg-white dark:bg-[#18181b] hover:bg-neutral-100 dark:hover:bg-neutral-800',
              ]"
              @click="elegir(g.clave, o.valor)"
            >
              {{ o.texto }}
            </button>
          </div>
        </div>

        <div>
          <label for="acta-obs" :class="claseEtiqueta">
            Observaciones <span v-if="hayIncumplimientos" class="text-red-500">*</span>
          </label>
          <textarea
            id="acta-obs"
            v-model="form.observaciones"
            rows="4"
            maxlength="2000"
            :class="claseCampo"
            :placeholder="hayIncumplimientos ? 'Detalle qué no cumple y qué debe corregir el solicitante.' : 'Opcional'"
          />
        </div>
      </section>

      <!-- Resultado -->
      <section v-if="resultado" :class="['rounded-2xl border p-4 sm:p-5 space-y-3', RESULTADO[resultado].clase]" aria-live="polite">
        <p class="text-xs font-bold uppercase tracking-wider">Resultado del acta</p>
        <p class="text-xl font-bold">{{ RESULTADO[resultado].texto }}</p>
        <p class="text-sm">{{ RESULTADO[resultado].detalle }}</p>
        <div v-if="resultado === 'OBSERVADO'">
          <p id="acta-plazo" class="text-xs font-bold uppercase tracking-wider mb-1.5">Plazo para subsanar</p>
          <div class="grid grid-cols-2 gap-2 max-w-xs" role="radiogroup" aria-labelledby="acta-plazo">
            <button
              v-for="d in PLAZOS_SUBSANACION"
              :key="d"
              type="button"
              role="radio"
              :aria-checked="form.plazo_subsanacion_dias === d"
              :class="[
                'h-10 rounded-xl border text-sm font-semibold cursor-pointer',
                form.plazo_subsanacion_dias === d ? 'border-amber-600 bg-amber-600 text-white' : 'border-amber-300 dark:border-amber-800 bg-white/70 dark:bg-transparent',
              ]"
              @click="form.plazo_subsanacion_dias = d"
            >
              {{ d }} días hábiles
            </button>
          </div>
        </div>
      </section>

      <!-- Fotos -->
      <section :class="claseSeccion">
        <div>
          <h2 class="text-sm font-bold text-neutral-800 dark:text-neutral-100">Fotos de sustento</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Obligatorias: son la prueba ante reclamos o auditorías. Se reducen antes de enviarlas.</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div v-for="o in fotosObligatorias" :key="o.tipo" class="space-y-1">
            <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-200">{{ o.nombre }} <span class="text-red-500">*</span></p>
            <div v-if="fotoDe(o.tipo)" class="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <img :src="fotoDe(o.tipo)!.url" :alt="`Foto: ${o.nombre}`" class="w-full h-full object-cover" />
              <button
                type="button"
                class="absolute top-1.5 right-1.5 px-2 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold cursor-pointer"
                @click="quitarFoto(o.tipo)"
              >
                Quitar
              </button>
            </div>
            <label
              v-else
              class="relative flex flex-col items-center justify-center gap-1 aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-xs font-semibold cursor-pointer hover:border-[#0d6efd] hover:text-[#0d6efd]"
            >
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Tomar foto
              <input type="file" accept="image/jpeg,image/png" capture="environment" class="sr-only" :disabled="procesandoFoto" @change="elegirFoto(o.tipo, $event)" />
            </label>
          </div>

          <div v-for="(f, i) in otrasFotos" :key="f.url" class="space-y-1">
            <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Otra {{ i + 1 }}</p>
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <img :src="f.url" :alt="`Foto adicional ${i + 1}`" class="w-full h-full object-cover" />
              <button type="button" class="absolute top-1.5 right-1.5 px-2 py-1 rounded-lg bg-black/60 text-white text-[11px] font-semibold cursor-pointer" @click="quitarFoto(f)">
                Quitar
              </button>
            </div>
          </div>

          <div v-if="fotos.length < MAXIMO_FOTOS" class="space-y-1">
            <p class="text-xs font-semibold text-neutral-700 dark:text-neutral-200">Adicional</p>
            <label class="relative flex flex-col items-center justify-center gap-1 aspect-[4/3] rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 text-neutral-400 text-xs font-semibold cursor-pointer hover:border-[#0d6efd] hover:text-[#0d6efd]">
              + Agregar foto
              <input type="file" accept="image/jpeg,image/png" capture="environment" class="sr-only" :disabled="procesandoFoto" @change="elegirFoto('OTRA', $event)" />
            </label>
          </div>
        </div>
        <p v-if="procesandoFoto" role="status" class="text-xs text-neutral-500 dark:text-neutral-400">Preparando la foto…</p>
      </section>

      <!-- Barra de envío pegada abajo, a mano en el celular -->
      <div class="sticky bottom-0 z-20 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur border border-neutral-200 dark:border-neutral-800 shadow-lg p-3">
        <div class="space-y-2">
          <p v-if="error" role="alert" class="text-sm text-red-700 dark:text-red-300 font-medium">{{ error }}</p>
          <button
            type="submit"
            :disabled="registrar.isPending.value || procesandoFoto"
            class="w-full h-12 rounded-xl bg-[#0d6efd] hover:bg-blue-600 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="registrar.isPending.value" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ registrar.isPending.value ? `Enviando… ${progreso}%` : 'Registrar acta' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
