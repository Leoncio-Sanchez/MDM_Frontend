<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import ModalShell from '../molecules/ModalShell.vue';
import Skeleton from '../atoms/Skeleton.vue';
import { useArchivos, useEliminarArchivo, useSubirArchivo } from '../../../application/composables/useArchivos';
import { container } from '../../../composition/container';
import { POLITICA_ARCHIVOS, type ArchivoAdjunto, type ModuloArchivos } from '../../../domain/entities/Archivo.entity';
import { useDialog, useToast, extractErrorMessage } from '../../../infrastructure/store/useNotificationStore';

/**
 * Adjuntos de un expediente, licencia o ITSE: actas, fotos de inspección y documentos.
 * Se usa igual en los tres módulos; solo cambia "modulo".
 */
interface Props {
  open: boolean;
  modulo: ModuloArchivos;
  /** Registro al que pertenecen los archivos (null = modal cerrado) */
  registroId: number | null;
  /** Ej. "Expediente N° 1250" */
  titulo: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [] }>();

const toast = useToast();
const dialog = useDialog();

const registroId = toRef(props, 'registroId');
const { data, isLoading, isError, error } = useArchivos(props.modulo, registroId);
const subir = useSubirArchivo(props.modulo, registroId);
const eliminar = useEliminarArchivo(props.modulo, registroId);

const archivos = computed<ArchivoAdjunto[]>(() => data.value ?? []);

// ── Subida ───────────────────────────────────────────────────────────
interface Subida {
  id: number;
  nombre: string;
  progreso: number;
}
const subidas = ref<Subida[]>([]);
let siguienteSubida = 0;
const arrastrando = ref(false);
const selector = ref<HTMLInputElement | null>(null);

const ACEPTA = POLITICA_ARCHIVOS.extensiones.map((e) => `.${e}`).join(',');
const MAXIMO_MB = POLITICA_ARCHIVOS.tamanioMaximoBytes / 1024 / 1024;

const extensionDe = (nombre: string) => (nombre.includes('.') ? nombre.split('.').pop()!.toLowerCase() : '');

/** Mismas reglas que el servidor, para avisar sin esperar la subida */
const motivoRechazo = (archivo: File): string | null => {
  if (!(POLITICA_ARCHIVOS.extensiones as readonly string[]).includes(extensionDe(archivo.name))) {
    return 'tipo no permitido';
  }
  if (archivo.size > POLITICA_ARCHIVOS.tamanioMaximoBytes) return `supera ${MAXIMO_MB} MB`;
  if (archivo.size === 0) return 'está vacío';
  return null;
};

/** Mensaje del servidor: 400 trae { archivo: ["..."] }; el resto { error } */
const mensajeError = (err: unknown) => {
  const errores = (err as any)?.response?.data?.archivo;
  return Array.isArray(errores) && errores.length ? String(errores[0]) : extractErrorMessage(err, 'No se pudo subir el archivo.');
};

const subirArchivos = async (lista: FileList | File[] | null) => {
  const todos = Array.from(lista ?? []);
  if (!todos.length || props.registroId === null) return;

  const rechazados = todos.map((a) => ({ a, motivo: motivoRechazo(a) })).filter((r) => r.motivo);
  if (rechazados.length) {
    toast.warning(
      rechazados.map((r) => `${r.a.name}: ${r.motivo}`).join(' · '),
      `${rechazados.length === 1 ? 'Un archivo no se subirá' : `${rechazados.length} archivos no se subirán`}`,
    );
  }

  let subidos = 0;
  // De a uno: así cada archivo muestra su propio progreso y un error no detiene al resto
  for (const archivo of todos.filter((a) => !motivoRechazo(a))) {
    const id = ++siguienteSubida;
    subidas.value = [...subidas.value, { id, nombre: archivo.name, progreso: 0 }];
    try {
      await subir.mutateAsync({
        archivo,
        onProgreso: (p) => {
          subidas.value = subidas.value.map((s) => (s.id === id ? { ...s, progreso: p } : s));
        },
      });
      subidos++;
    } catch (err) {
      toast.error(mensajeError(err), archivo.name);
    } finally {
      subidas.value = subidas.value.filter((s) => s.id !== id);
    }
  }

  if (subidos) toast.success(subidos === 1 ? 'Se subió el archivo.' : `Se subieron ${subidos} archivos.`);
  if (selector.value) selector.value.value = '';
};

const alSoltar = (e: DragEvent) => {
  arrastrando.value = false;
  subirArchivos(e.dataTransfer?.files ?? null);
};

// ── Ver / descargar / eliminar ───────────────────────────────────────
const abriendo = ref<string | null>(null);

const seAbreEnNavegador = (a: ArchivoAdjunto) =>
  (POLITICA_ARCHIVOS.extensionesEnLinea as readonly string[]).includes(a.extension.toLowerCase());

const abrir = async (a: ArchivoAdjunto) => {
  // La pestaña se abre en el mismo clic: si se abre después de descargar, el navegador la bloquea
  const pestana = seAbreEnNavegador(a) ? window.open('', '_blank') : null;
  abriendo.value = a.uuid;
  try {
    const contenido = await container.archivos.descargar(props.modulo, a.uuid);
    const url = URL.createObjectURL(contenido);
    if (pestana) {
      pestana.location.href = url;
    } else {
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = a.nombre_original;
      enlace.click();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    pestana?.close();
    toast.error(extractErrorMessage(err, 'No se pudo abrir el archivo.'), a.nombre_original);
  } finally {
    abriendo.value = null;
  }
};

const confirmarEliminar = async (a: ArchivoAdjunto) => {
  const ok = await dialog.confirmDelete({
    title: 'Eliminar archivo',
    text: `¿Eliminar "${a.nombre_original}"?\nEl archivo se borrará definitivamente.`,
    onConfirm: () => eliminar.mutateAsync(a.id),
  });
  if (ok) toast.success('El archivo se eliminó.');
};

// ── Presentación ─────────────────────────────────────────────────────
const tamano = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const fecha = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const estiloTipo = (extension: string) => {
  const e = extension.toLowerCase();
  if (e === 'pdf') return { etiqueta: 'PDF', clase: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900' };
  if (['jpg', 'jpeg', 'png'].includes(e)) return { etiqueta: 'IMG', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' };
  if (['doc', 'docx'].includes(e)) return { etiqueta: 'DOC', clase: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900' };
  if (['xls', 'xlsx'].includes(e)) return { etiqueta: 'XLS', clase: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900' };
  return { etiqueta: e.toUpperCase() || '?', clase: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
};

const ocupado = computed(() => subidas.value.length > 0);
</script>

<template>
  <ModalShell :open="open" max-width="max-w-2xl" labelledby="archivos-titulo">
    <div class="relative w-full bg-white dark:bg-[#18181b] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh]">
      <!-- Encabezado -->
      <div class="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h2 id="archivos-titulo" class="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">Archivos adjuntos</h2>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{{ titulo }}</p>
        </div>
        <button
          type="button"
          class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer disabled:opacity-40"
          :disabled="ocupado"
          aria-label="Cerrar"
          @click="emit('close')"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-5 sm:p-6 space-y-5 overflow-y-auto">
        <!-- Zona para soltar o elegir archivos -->
        <label
          :class="[
            'flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center cursor-pointer transition-colors',
            arrastrando
              ? 'border-[#0d6efd] bg-blue-50 dark:bg-blue-950/30'
              : 'border-neutral-300 dark:border-neutral-700 hover:border-[#0d6efd] hover:bg-neutral-50 dark:hover:bg-neutral-800/40',
          ]"
          @dragover.prevent="arrastrando = true"
          @dragleave.prevent="arrastrando = false"
          @drop.prevent="alSoltar"
        >
          <svg class="w-8 h-8 text-[#0d6efd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
          </svg>
          <span class="text-sm font-semibold text-neutral-800 dark:text-neutral-100">Arrastre archivos aquí o haga clic para elegirlos</span>
          <span class="text-xs text-neutral-500 dark:text-neutral-400">PDF, fotos JPG o PNG, Word y Excel · máximo {{ MAXIMO_MB }} MB por archivo</span>
          <input ref="selector" type="file" multiple :accept="ACEPTA" class="sr-only" @change="subirArchivos(($event.target as HTMLInputElement).files)" />
        </label>

        <!-- Subidas en curso -->
        <ul v-if="subidas.length" class="space-y-2" aria-live="polite">
          <li v-for="s in subidas" :key="s.id" class="text-xs">
            <div class="flex justify-between text-neutral-600 dark:text-neutral-300 mb-1">
              <span class="truncate">Subiendo {{ s.nombre }}…</span>
              <span class="font-semibold tabular-nums">{{ s.progreso }}%</span>
            </div>
            <div class="h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <div class="h-full bg-[#0d6efd] transition-all" :style="{ width: `${s.progreso}%` }"></div>
            </div>
          </li>
        </ul>

        <!-- Lista de archivos -->
        <div>
          <h3 class="text-xs font-bold text-neutral-600 dark:text-neutral-300 uppercase tracking-wider mb-2">
            Archivos {{ archivos.length ? `(${archivos.length})` : '' }}
          </h3>

          <ul v-if="isLoading" class="space-y-2" aria-busy="true">
            <li v-for="n in 3" :key="n" class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
              <Skeleton class="w-10 h-10" rounded="lg" />
              <div class="flex-1 space-y-1.5">
                <Skeleton class="h-3.5 w-48" />
                <Skeleton class="h-3 w-28" />
              </div>
            </li>
          </ul>

          <p v-else-if="isError" role="alert" class="text-sm text-red-600 dark:text-red-400 p-3 rounded-xl bg-red-50 dark:bg-red-950/40">
            No se pudieron cargar los archivos: {{ extractErrorMessage(error) }}
          </p>

          <p v-else-if="!archivos.length" class="text-sm text-neutral-500 dark:text-neutral-400 p-4 text-center rounded-xl bg-neutral-50 dark:bg-neutral-800/40">
            Todavía no hay archivos adjuntos.
          </p>

          <ul v-else class="space-y-2">
            <li
              v-for="a in archivos"
              :key="a.id"
              class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
            >
              <span :class="['w-10 h-10 shrink-0 rounded-lg border flex items-center justify-center text-[10px] font-bold', estiloTipo(a.extension).clase]">
                {{ estiloTipo(a.extension).etiqueta }}
              </span>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate" :title="a.nombre_original">{{ a.nombre_original }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ tamano(a.tamanio_bytes) }} · {{ fecha(a.fecha_digitacion) }}</p>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0d6efd] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer disabled:opacity-50"
                  :disabled="abriendo === a.uuid"
                  :aria-label="`${seAbreEnNavegador(a) ? 'Ver' : 'Descargar'} ${a.nombre_original}`"
                  @click="abrir(a)"
                >
                  {{ abriendo === a.uuid ? 'Abriendo…' : seAbreEnNavegador(a) ? 'Ver' : 'Descargar' }}
                </button>
                <button
                  type="button"
                  class="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  :aria-label="`Eliminar ${a.nombre_original}`"
                  @click="confirmarEliminar(a)"
                >
                  Eliminar
                </button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Pie -->
      <div class="flex justify-end p-4 sm:px-6 border-t border-neutral-200 dark:border-neutral-800">
        <button
          type="button"
          class="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer disabled:opacity-50"
          :disabled="ocupado"
          @click="emit('close')"
        >
          {{ ocupado ? 'Subiendo…' : 'Cerrar' }}
        </button>
      </div>
    </div>
  </ModalShell>
</template>
