<script setup lang="ts">
import { ref, computed } from 'vue';
import CrudTable from '../components/organisms/CrudTable.vue';
import ArchivosAdjuntos from '../components/organisms/ArchivosAdjuntos.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import SearchableSelect, { type SelectOption } from '../components/molecules/SearchableSelect.vue';
import {
  useExpedientesList,
  useCrearExpedientes,
  useActualizarExpedientes,
  useAnularExpediente,
  useExpedientesPendientes,
} from '../../application/composables/useExpedientes';
import type { Expedientes, TipoDenegatoria } from '../../domain/entities/Expedientes.entity';
import DenegatoriaModal from '../components/organisms/DenegatoriaModal.vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import { useTiposProcedimientoTupaList } from '../../application/composables/useTiposProcedimientoTupa';
import { usePersonasList } from '../../application/composables/usePersonas';
import { useFormDraft } from '../../application/composables/useFormDraft';

const { data, isLoading } = useExpedientesList();
const { data: tupaList } = useTiposProcedimientoTupaList();
const { data: personasList } = usePersonasList();

const crear = useCrearExpedientes();
const actualizar = useActualizarExpedientes();
const anular = useAnularExpediente();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

// Fecha local (no UTC): con toISOString(), después de las 19:00 en Lima se sugería el día siguiente
const hoy = new Date();
const today = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'expediente',
  initialData: {
    numero_expediente: '' as string | number,
    fecha_recepcion: today,
    tipo_procedimiento_tupa_id: '' as string | number,
    solicitante_id: '' as string | number,
    representante_id: '' as string | number,
    observaciones: '',
  },
});

const isSubmitting = computed(() => crear.isPending.value || actualizar.isPending.value);

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'numero_expediente', label: 'N° EXPEDIENTE' },
  { key: 'fecha_recepcion_texto', label: 'FECHA RECEPCIÓN' },
  { key: 'fecha_vencimiento', label: 'FECHA VENCIMIENTO' },
  { key: 'procedimiento_texto', label: 'PROCEDIMIENTO TUPA' },
  { key: 'solicitante_texto', label: 'SOLICITANTE' },
  { key: 'estado_texto', label: 'ESTADO' },
];

const expedientes = computed(() => {
  if (Array.isArray(data.value)) return data.value;
  return (data.value as any)?.results ?? [];
});

const tupaOptions = computed(() => {
  if (Array.isArray(tupaList.value)) return tupaList.value;
  return (tupaList.value as any)?.results ?? [];
});

const personasOptions = computed(() => {
  if (Array.isArray(personasList.value)) return personasList.value;
  return (personasList.value as any)?.results ?? [];
});

const tupaSelectOptions = computed<SelectOption[]>(() => {
  // Los procedimientos inactivos no se ofrecen; se mantiene el que ya tiene el expediente en edición
  return tupaOptions.value
    .filter((proc: any) => proc.esta_activo || String(proc.id) === String(form.value.tipo_procedimiento_tupa_id))
    .map((proc: any) => ({
    value: proc.id,
    label: proc.nombre,
    code: proc.codigo,
    badge: proc.plazo_atencion_dias ? `Plazo: ${proc.plazo_atencion_dias} días` : undefined,
  }));
});

const personasSelectOptions = computed<SelectOption[]>(() => {
  return personasOptions.value.map((p: any) => {
    return {
      value: p.id,
      label: nombrePersona(p) || `Persona #${p.id}`,
      // Todos sus documentos, para encontrarla por cualquiera de ellos (DNI, RUC, CE...)
      badge: (p.documentos ?? []).map((d: any) => d.numero_documento).join(' · ') || undefined,
    };
  });
});

const tupaById = computed(() => new Map(tupaOptions.value.map((t: any) => [t.id, t])));
const personasById = computed(() => new Map(personasOptions.value.map((p: any) => [p.id, p])));

const nombrePersona = (p: any) =>
  p.tipo_persona === 'J' ? p.nombres : [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');

/** Filas de la tabla: se conservan los campos originales (los usa Editar) y se agregan textos legibles. */
const filasTabla = computed(() =>
  expedientes.value.map((e: any) => {
    const tupaId = e.tipo_procedimiento_tupa ?? e.tipo_procedimiento_tupa_id;
    const tupa: any = tupaById.value.get(tupaId);
    const solicitanteId = e.solicitante ?? e.solicitante_id;
    const persona = personasById.value.get(solicitanteId);
    return {
      ...e,
      // "2026-10-12T00:00:00-05:00" -> "2026-10-12"
      fecha_recepcion_texto: e.fecha_recepcion ? String(e.fecha_recepcion).split('T')[0] : '',
      procedimiento_texto: tupa ? `${tupa.codigo} · ${tupa.nombre}` : tupaId ? `#${tupaId}` : '',
      solicitante_texto: persona ? nombrePersona(persona) : solicitanteId ? `#${solicitanteId}` : '',
      estado_texto: e.anulado ? 'ANULADO' : 'Activo',
    };
  }),
);

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  formError.value = null;
  loadDraft();
  if (!form.value.fecha_recepcion) {
    form.value.fecha_recepcion = today;
  }
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  isEditMode.value = true;
  editingId.value = item.id;
  formError.value = null;
  
  const fechaRec = item.fecha_recepcion ? item.fecha_recepcion.split('T')[0] : today;

  setFormData({
    numero_expediente: item.numero_expediente || '',
    fecha_recepcion: fechaRec,
    tipo_procedimiento_tupa_id: item.tipo_procedimiento_tupa || item.tipo_procedimiento_tupa_id || '',
    solicitante_id: item.solicitante || item.solicitante_id || '',
    representante_id: item.representante_id || '',
    observaciones: item.observaciones || '',
  });
  isModalOpen.value = true;
};

// ── Anulación (LPAG, Ley 27444: los expedientes no se eliminan) ──────
const MOTIVO_MINIMO = 10;
const MOTIVO_MAXIMO = 500;
const aAnular = ref<Expedientes | null>(null);
const formAnular = ref({ motivo: '', documento: '' });
const erroresAnular = ref<Record<string, string>>({});
const modalAnularAbierto = computed({
  get: () => aAnular.value !== null,
  set: (abierto: boolean) => {
    if (!abierto) aAnular.value = null;
  },
});
const largoMotivo = computed(() => formAnular.value.motivo.trim().length);

const handleAnular = (item: Expedientes) => {
  aAnular.value = item;
  formAnular.value = { motivo: '', documento: '' };
  erroresAnular.value = {};
};

const confirmarAnulacion = async () => {
  const expediente = aAnular.value;
  if (!expediente) return;
  erroresAnular.value = {};
  if (largoMotivo.value < MOTIVO_MINIMO) {
    erroresAnular.value = { motivo: `El motivo debe tener al menos ${MOTIVO_MINIMO} caracteres.` };
    return;
  }
  try {
    await anular.mutateAsync({
      id: expediente.id,
      datos: { motivo: formAnular.value.motivo.trim(), documento: formAnular.value.documento.trim() || null },
    });
    aAnular.value = null;
    toast.success('Queda registrado con su motivo; ya no aparece entre los pendientes.', `Expediente N° ${expediente.numero_expediente} anulado`);
  } catch (err) {
    erroresAnular.value = extractFieldErrors(err);
    if (!Object.keys(erroresAnular.value).length) erroresAnular.value = { general: extractErrorMessage(err, 'No se pudo anular el expediente.') };
  }
};

const fechaHora = (iso: string) =>
  new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Lima' }).format(new Date(iso));

const verAnulacion = (item: Expedientes) => {
  const a = item.anulacion;
  if (!a) return;
  dialog.info(
    `Expediente N° ${item.numero_expediente} anulado`,
    [
      `Motivo: ${a.motivo}`,
      a.documento ? `Documento: ${a.documento}` : null,
      `Fecha: ${fechaHora(a.fecha)}`,
      `Registrado por: ${a.usuario_nombre ?? `usuario #${a.usuario}`}`,
    ].filter(Boolean).join('\n'),
  );
};

const handleSubmit = () => {
  formError.value = null;

  if (!form.value.fecha_recepcion) {
    formError.value = 'La fecha de recepción es obligatoria';
    return;
  }
  if (!form.value.tipo_procedimiento_tupa_id) {
    formError.value = 'Debe seleccionar un Procedimiento TUPA';
    return;
  }
  if (!form.value.solicitante_id) {
    formError.value = 'Seleccione el solicitante. Si no aparece, regístrelo primero en Personas.';
    return;
  }

  const payload: any = {
    fecha_recepcion: form.value.fecha_recepcion,
    tipo_procedimiento_tupa_id: Number(form.value.tipo_procedimiento_tupa_id),
    solicitante_id: Number(form.value.solicitante_id),
    observaciones: form.value.observaciones?.trim() || null,
  };

  if (form.value.numero_expediente) {
    payload.numero_expediente = Number(form.value.numero_expediente);
  }

  if (form.value.representante_id) {
    payload.representante_id = Number(form.value.representante_id);
  }

  if (isEditMode.value && editingId.value) {
    actualizar.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar expediente';
        }
      }
    );
  } else {
    crear.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success('El registro se creó correctamente.');
      },
      onError: (err: any) => {
        formError.value = err?.response?.data?.message || err?.message || 'Error al registrar expediente';
      }
    });
  }
};

// ── Denegatoria (respuesta final desfavorable de la ITSE o de la licencia) ──
// Solo lo que sigue pendiente y lo que la oficina del usuario evalúa
const auth = useAuthStore();
/** Registrar, editar y anular expedientes es de mesa de partes; ITSE y Licencias solo consultan */
const esMesaDePartes = computed(() => auth.puede(['expedientes']));
const { data: pendientesData } = useExpedientesPendientes();
const pendientesPorId = computed(() => new Map((pendientesData.value ?? []).map((p) => [p.id, p])));
const tiposDenegables = (row: { id: number; anulado?: boolean }): TipoDenegatoria[] => {
  const p = pendientesPorId.value.get(row.id);
  if (!p || row.anulado) return [];
  const tipos: TipoDenegatoria[] = [];
  if (p.itse_pendiente && auth.puede(['itse'])) tipos.push('ITSE');
  if (p.licencia_pendiente && auth.puede(['licencias'])) tipos.push('LF');
  return tipos;
};
const aDenegar = ref<{ id: number; numero: number | string; tipos: TipoDenegatoria[] } | null>(null);
const abrirDenegatoria = (row: { id: number; numero_expediente?: number; anulado?: boolean }) => {
  aDenegar.value = { id: row.id, numero: row.numero_expediente ?? row.id, tipos: tiposDenegables(row) };
};

// ── Archivos adjuntos (actas, fotos, documentos) ─────────────────────
const archivosDe = ref<{ id: number; titulo: string } | null>(null);
const abrirArchivos = (row: { id: number; numero_expediente?: string | number }) => {
  archivosDe.value = { id: row.id, titulo: `Expediente N° ${row.numero_expediente ?? row.id}` };
};
</script>

<template>
  <div class="space-y-4">
    <CrudTable 
      title="Listado de Expedientes TUPA"
      :columns="columns"
      :data="filasTabla"
      :is-loading="isLoading"
      delete-label="Anular"
      :sin-alta="!esMesaDePartes"
      :fila-bloqueada="(row) => !!row.anulado || !esMesaDePartes"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleAnular">
      <template #acciones-fila="{ row }">
        <button
          v-if="row.anulado"
          type="button"
          class="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 mr-4 font-semibold hover:underline cursor-pointer"
          @click="verAnulacion(row)"
        >
          Ver anulación
        </button>
        <button
          type="button"
          class="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white mr-4 font-semibold hover:underline cursor-pointer"
          @click="abrirArchivos(row)"
        >
          Archivos
        </button>
        <button
          v-if="tiposDenegables(row).length"
          type="button"
          class="text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 mr-4 font-semibold hover:underline cursor-pointer"
          @click="abrirDenegatoria(row)"
        >
          Denegar
        </button>
      </template>
    </CrudTable>

    <DenegatoriaModal
      :expediente="aDenegar ? { id: aDenegar.id, numero: aDenegar.numero } : null"
      :tipos="aDenegar?.tipos ?? []"
      @close="aDenegar = null"
    />

    <!-- Anulación: el expediente no se borra, queda como constancia con motivo, fecha y usuario -->
    <LargeModal
      v-model="modalAnularAbierto"
      :title="`Anular expediente N° ${aAnular?.numero_expediente ?? ''}`"
      subtitle="El expediente no se borra: queda registrado como anulado, con el motivo, la fecha y quién lo anuló."
      max-width="max-w-xl"
      :is-loading="anular.isPending.value"
      submit-text="Anular expediente"
      @submit="confirmarAnulacion"
      :guarda-borrador="false"
    >
      <div v-if="erroresAnular.general" role="alert" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl">
        {{ erroresAnular.general }}
      </div>
      <p class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
        Un expediente anulado sale de los pendientes y ya no admite cambios, ampliaciones de plazo, denegatorias ni la emisión de licencia o ITSE. La anulación no se puede revertir.
      </p>
      <div>
        <label for="motivo-anulacion" class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
          Motivo <span class="text-red-500">*</span>
        </label>
        <textarea
          id="motivo-anulacion"
          v-model="formAnular.motivo"
          rows="4"
          :maxlength="MOTIVO_MAXIMO"
          placeholder="Ej. Desistimiento presentado por el solicitante mediante carta del 12/10/2026"
          :aria-invalid="!!erroresAnular.motivo"
          :class="[
            'w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 resize-none',
            erroresAnular.motivo ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700',
          ]"
        ></textarea>
        <div class="flex justify-between mt-1 text-xs">
          <span v-if="erroresAnular.motivo" class="text-red-600 dark:text-red-400">{{ erroresAnular.motivo }}</span>
          <span v-else class="text-neutral-500 dark:text-neutral-400">Mínimo {{ MOTIVO_MINIMO }} caracteres.</span>
          <span class="text-neutral-400 tabular-nums">{{ largoMotivo }}/{{ MOTIVO_MAXIMO }}</span>
        </div>
      </div>
      <div>
        <label for="documento-anulacion" class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
          Documento que la sustenta <span class="text-neutral-400 dark:text-neutral-500 font-normal">(Opcional)</span>
        </label>
        <input
          id="documento-anulacion"
          v-model="formAnular.documento"
          type="text"
          maxlength="100"
          placeholder="Ej. Resolución Gerencial N° 045-2026-MDM/GDES"
          class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200"
        />
        <span v-if="erroresAnular.documento" class="block mt-1 text-xs text-red-600 dark:text-red-400">{{ erroresAnular.documento }}</span>
      </div>
    </LargeModal>

    <ArchivosAdjuntos
      :open="archivosDe !== null"
      modulo="expedientes"
      :registro-id="archivosDe?.id ?? null"
      :titulo="archivosDe?.titulo ?? ''"
      :solo-consulta="!esMesaDePartes"
      @close="archivosDe = null"
    />

    <!-- Modal Grande de Registro / Edición de Expedientes con Persistencia LocalStorage -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Expediente TUPA' : 'Nuevo Expediente TUPA'"
      :subtitle="isEditMode ? `Actualizando Expediente #${form.numero_expediente || editingId}` : 'Complete los datos obligatorios para el ingreso del expediente administrativo'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Actualizar Expediente' : 'Generar Expediente'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <!-- Alerta de Error -->
      <div v-if="formError" class="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <!-- Cuadrícula Responsiva del Formulario -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Número de Expediente -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            N° de Expediente <span class="text-neutral-400 dark:text-neutral-500 font-normal">(Opcional / Autonumérico)</span>
          </label>
          <input
            v-model="form.numero_expediente"
            type="number"
            min="1"
            placeholder="Ej. 20260012"
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
          />
        </div>

        <!-- Fecha de Recepción -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Fecha de Recepción <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.fecha_recepcion"
            type="date"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
          />
        </div>

        <!-- Procedimiento TUPA (Selector Buscador con Código, Título y Plazo) -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Procedimiento TUPA Asociado <span class="text-red-500">*</span>
          </label>
          <SearchableSelect
            v-model="form.tipo_procedimiento_tupa_id"
            :options="tupaSelectOptions"
            placeholder="Buscar o seleccionar procedimiento TUPA..."
            search-placeholder="Escriba código (ej. PE65...) o nombre del procedimiento..."
          />
        </div>

        <!-- Solicitante y representante: se buscan por documento o nombre entre las personas registradas -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Solicitante / Administrado <span class="text-red-500">*</span>
          </label>
          <SearchableSelect
            v-model="form.solicitante_id"
            :options="personasSelectOptions"
            placeholder="Buscar solicitante por DNI, RUC o nombre..."
            search-placeholder="Escriba DNI, RUC o nombres..."
          />
        </div>

        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Representante Legal <span class="text-neutral-400 dark:text-neutral-500 font-normal">(Opcional)</span>
          </label>
          <SearchableSelect
            v-model="form.representante_id"
            :options="personasSelectOptions"
            placeholder="Sin representante"
            search-placeholder="Escriba DNI, RUC o nombres..."
          />
        </div>

        <p class="sm:col-span-2 -mt-2 text-[11px] text-neutral-500 dark:text-neutral-400">
          <template v-if="personasOptions.length === 0">No hay personas registradas.</template>
          <template v-else>¿No aparece?</template>
          Regístrela primero en
          <router-link to="/admin/personas" class="font-semibold text-[#0d6efd] hover:underline">Personas / Administrados</router-link><template v-if="!isEditMode">; lo que lleva escrito aquí se guarda como borrador</template>.
        </p>

        <!-- Observaciones / Sumilla -->
        <div class="sm:col-span-2">
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Observaciones / Asunto de Trámite <span class="text-neutral-400 dark:text-neutral-500 font-normal">(Máx. 250 caracteres)</span>
          </label>
          <textarea
            v-model="form.observaciones"
            rows="3"
            maxlength="250"
            placeholder="Describa brevemente la solicitud o requerimiento del administrado..."
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all resize-none"
          ></textarea>
        </div>
      </div>
    </LargeModal>
  </div>
</template>