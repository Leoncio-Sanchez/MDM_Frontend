<script setup lang="ts">
import { ref, computed } from 'vue';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';
import SearchableSelect, { type SelectOption } from '../components/molecules/SearchableSelect.vue';
import {
  useExpedientesList,
  useCrearExpedientes,
  useActualizarExpedientes,
  useEliminarExpedientes,
} from '../../application/composables/useExpedientes';
import { useTiposProcedimientoTupaList } from '../../application/composables/useTiposProcedimientoTupa';
import { usePersonasList } from '../../application/composables/usePersonas';
import { useFormDraft } from '../../application/composables/useFormDraft';

const { data, isLoading } = useExpedientesList();
const { data: tupaList } = useTiposProcedimientoTupaList();
const { data: personasList } = usePersonasList();

const crear = useCrearExpedientes();
const actualizar = useActualizarExpedientes();
const eliminar = useEliminarExpedientes();
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
  { key: 'solicitante_texto', label: 'SOLICITANTE' }
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
  return tupaOptions.value.map((proc: any) => ({
    value: proc.id,
    label: proc.nombre,
    code: proc.codigo,
    badge: proc.plazo_atencion_dias ? `Plazo: ${proc.plazo_atencion_dias} días` : undefined,
  }));
});

const personasSelectOptions = computed<SelectOption[]>(() => {
  return personasOptions.value.map((p: any) => {
    const fullName = `${p.nombres || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.trim() || p.razon_social || `Persona #${p.id}`;
    return {
      value: p.id,
      label: fullName,
      code: `ID: ${p.id}`,
      badge: p.numero_documento ? `Doc: ${p.numero_documento}` : undefined,
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

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar el Expediente #${item.numero_expediente || item.id}?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
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
    formError.value = 'El ID del solicitante (Persona) es obligatorio';
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
</script>

<template>
  <div class="space-y-4">
    <CrudTable 
      title="Listado de Expedientes TUPA"
      :columns="columns"
      :data="filasTabla"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
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

        <!-- ID de Solicitante / Administrado (Selector Buscador de Personas) -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Solicitante / Administrado <span class="text-red-500">*</span>
          </label>
          <SearchableSelect
            v-if="personasOptions.length > 0"
            v-model="form.solicitante_id"
            :options="personasSelectOptions"
            placeholder="Buscar solicitante por nombre o documento..."
            search-placeholder="Escriba DNI, RUC o nombres..."
          />
          <input
            v-else
            v-model="form.solicitante_id"
            type="number"
            min="1"
            required
            placeholder="Ingrese ID de Persona (ej. 1)"
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
          />
        </div>

        <!-- ID de Representante Legal (Opcional) -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            ID Representante Legal <span class="text-neutral-400 dark:text-neutral-500 font-normal">(Opcional)</span>
          </label>
          <input
            v-model="form.representante_id"
            type="number"
            min="1"
            placeholder="ID representante legal si aplica"
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 transition-all"
          />
        </div>

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