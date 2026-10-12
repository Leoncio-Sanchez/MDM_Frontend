<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  useLicenciasFuncionamientoList,
  useCrearLicenciasFuncionamiento,
  useActualizarLicenciasFuncionamiento,
  useEliminarLicenciasFuncionamiento,
} from '../../application/composables/useLicenciasFuncionamiento';
import { useTiposLicenciaList } from '../../application/composables/useTiposLicencia';
import { useExpedientesList } from '../../application/composables/useExpedientes';
import { usePersonasList } from '../../application/composables/usePersonas';
import { useNivelesRiesgoList } from '../../application/composables/useNivelesRiesgo';
import { useZonificacionesList } from '../../application/composables/useZonificaciones';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog } from '../../infrastructure/store/useNotificationStore';

const { data, isLoading, error } = useLicenciasFuncionamientoList();
const { data: tiposLicenciaData } = useTiposLicenciaList();
const { data: expedientesData } = useExpedientesList();
const { data: personasData } = usePersonasList();
const { data: nivelesRiesgoData } = useNivelesRiesgoList();
const { data: zonificacionesData } = useZonificacionesList();

const crearLicencia = useCrearLicenciasFuncionamiento();
const actualizarLicencia = useActualizarLicenciasFuncionamiento();
const eliminar = useEliminarLicenciasFuncionamiento();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'licencia_funcionamiento',
  initialData: {
    numero_licencia: '' as string | number,
    nombre_comercial: '',
    tipo_licencia_id: '' as string | number,
    titular_id: '' as string | number,
    conductor_id: '' as string | number,
    expediente_id: '' as string | number,
    nivel_riesgo_id: '' as string | number,
    zonificacion_id: '' as string | number,
    actividad: '',
    direccion: '',
    resolucion_numero: '',
    area: '' as string | number,
    numero_recibo_pago: '',
    es_vigencia_indeterminada: true,
    observaciones: '',
  },
});

const isSubmitting = computed(() => crearLicencia.isPending.value || actualizarLicencia.isPending.value);

const displayData = computed(() => {
  if (Array.isArray(data.value)) return data.value;
  return (data.value as any)?.results ?? [];
});

const tiposLicenciaOptions = computed(() => {
  if (Array.isArray(tiposLicenciaData.value)) return tiposLicenciaData.value;
  return (tiposLicenciaData.value as any)?.results ?? [];
});

const expedientesOptions = computed(() => {
  if (Array.isArray(expedientesData.value)) return expedientesData.value;
  return (expedientesData.value as any)?.results ?? [];
});

const personasOptions = computed(() => {
  if (Array.isArray(personasData.value)) return personasData.value;
  return (personasData.value as any)?.results ?? [];
});

const nivelesRiesgoOptions = computed(() => {
  if (Array.isArray(nivelesRiesgoData.value)) return nivelesRiesgoData.value;
  return (nivelesRiesgoData.value as any)?.results ?? [];
});

const zonificacionesOptions = computed(() => {
  if (Array.isArray(zonificacionesData.value)) return zonificacionesData.value;
  return (zonificacionesData.value as any)?.results ?? [];
});

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'numero_licencia', label: 'N° LICENCIA' },
  { key: 'nombre_comercial', label: 'NOMBRE COMERCIAL' },
  { key: 'tipo_licencia', label: 'TIPO' },
  { key: 'expediente', label: 'EXPEDIENTE' },
  { key: 'fecha_emision', label: 'FECHA EMISIÓN' },
  { key: 'es_vigencia_indeterminada', label: 'INDETERMINADA' },
];

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  formError.value = null;
  loadDraft();
  isModalOpen.value = true;
};

const handleEdit = (item: any) => {
  isEditMode.value = true;
  editingId.value = item.id;
  formError.value = null;
  setFormData({
    numero_licencia: item.numero_licencia || '',
    nombre_comercial: item.nombre_comercial || '',
    tipo_licencia_id: item.tipo_licencia || item.tipo_licencia_id || '',
    titular_id: item.titular || item.titular_id || '',
    conductor_id: item.conductor || item.conductor_id || '',
    expediente_id: item.expediente || item.expediente_id || '',
    nivel_riesgo_id: item.nivel_riesgo || item.nivel_riesgo_id || '',
    zonificacion_id: item.zonificacion || item.zonificacion_id || '',
    actividad: item.actividad || '',
    direccion: item.direccion || '',
    resolucion_numero: item.resolucion_numero || '',
    area: item.area || '',
    numero_recibo_pago: item.numero_recibo_pago || '',
    es_vigencia_indeterminada: item.es_vigencia_indeterminada ?? true,
    observaciones: item.observaciones || '',
  });
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de anular/eliminar la Licencia de Funcionamiento N° ${item.numero_licencia}?\nEsta acción no se puede deshacer.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('El registro se eliminó correctamente.');
};

const handleSubmit = () => {
  formError.value = null;

  if (!isEditMode.value && !form.value.numero_licencia) {
    formError.value = 'El número de licencia es obligatorio (ej. 1001)';
    return;
  }
  if (!form.value.nombre_comercial.trim()) {
    formError.value = 'El nombre comercial o razón social es obligatorio';
    return;
  }
  if (!form.value.tipo_licencia_id) {
    formError.value = 'Seleccione el tipo de licencia';
    return;
  }
  if (!form.value.titular_id) {
    formError.value = 'Seleccione el titular o administrado';
    return;
  }
  if (!form.value.expediente_id) {
    formError.value = 'Seleccione el expediente municipal de trámite';
    return;
  }
  if (!form.value.nivel_riesgo_id) {
    formError.value = 'Seleccione la clasificación del nivel de riesgo';
    return;
  }
  if (!form.value.zonificacion_id) {
    formError.value = 'Seleccione la zonificación urbana';
    return;
  }

  const payload: any = {
    nombre_comercial: form.value.nombre_comercial.trim().toUpperCase(),
    tipo_licencia_id: Number(form.value.tipo_licencia_id),
    titular_id: Number(form.value.titular_id),
    conductor_id: form.value.conductor_id ? Number(form.value.conductor_id) : Number(form.value.titular_id),
    expediente_id: Number(form.value.expediente_id),
    nivel_riesgo_id: Number(form.value.nivel_riesgo_id),
    zonificacion_id: Number(form.value.zonificacion_id),
    actividad: form.value.actividad?.trim() || '',
    direccion: form.value.direccion?.trim() || '',
    resolucion_numero: form.value.resolucion_numero?.trim() || '',
    area: form.value.area ? Number(form.value.area) : 0,
    numero_recibo_pago: form.value.numero_recibo_pago?.trim() || '',
    es_vigencia_indeterminada: Boolean(form.value.es_vigencia_indeterminada),
    observaciones: form.value.observaciones?.trim() || null,
  };

  if (!isEditMode.value) {
    payload.numero_licencia = String(form.value.numero_licencia);
  }

  if (isEditMode.value && editingId.value) {
    actualizarLicencia.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al actualizar la licencia';
        },
      }
    );
  } else {
    crearLicencia.mutate(
      payload,
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('El registro se creó correctamente.');
        },
        onError: (err: any) => {
          formError.value = err?.response?.data?.message || err?.message || 'Error al emitir la licencia';
        },
      }
    );
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 dark:text-red-400 font-semibold mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl">
      Error al cargar licencias: {{ error.message }}
    </div>

    <CrudTable 
      title="Registro y Control de Licencias de Funcionamiento"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <!-- Modal Grande de Emisión / Edición con Persistencia de Borrador -->
    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Licencia de Funcionamiento' : 'Emitir Nueva Licencia de Funcionamiento'"
      :subtitle="isEditMode ? `Modificando Licencia #${editingId}` : 'Complete los datos técnicos y normativos para la emisión del certificado municipal'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Emitir Licencia Oficial'"
      @submit="handleSubmit"
      @discard-draft="clearDraft"
    >
      <!-- Alerta de Error de Validación -->
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl flex items-center gap-2">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4">
        <!-- Bloque 1: Identificación de la Licencia -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Número de Licencia -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              N° de Licencia <span v-if="!isEditMode" class="text-red-500">*</span>
            </label>
            <input
              v-model="form.numero_licencia"
              type="number"
              placeholder="Ej. 1001, 2026001"
              :disabled="isEditMode"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all font-mono font-bold text-neutral-800 dark:text-neutral-200"
            />
            <p v-if="isEditMode" class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">El número correlativo oficial de licencia es inmutable.</p>
          </div>

          <!-- Tipo de Licencia -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Tipo de Licencia <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.tipo_licencia_id"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            >
              <option value="" disabled>Seleccione tipo...</option>
              <option v-for="tl in tiposLicenciaOptions" :key="tl.id" :value="tl.id">
                {{ tl.nombre }} ({{ tl.codigo }})
              </option>
            </select>
          </div>
        </div>

        <!-- Nombre Comercial -->
        <div>
          <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
            Nombre Comercial o Razón Social <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.nombre_comercial"
            type="text"
            placeholder="Ej. BODEGA Y MINIMARKET SANTA ROSA"
            required
            class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all uppercase font-medium text-neutral-800 dark:text-neutral-200"
          />
        </div>

        <!-- Bloque 2: Expediente y Personas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Expediente de Origen -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Expediente Municipal de Origen <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.expediente_id"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            >
              <option value="" disabled>Seleccione expediente...</option>
              <option v-for="exp in expedientesOptions" :key="exp.id" :value="exp.id">
                Exp. #{{ exp.numero_expediente || exp.id }} ({{ exp.fecha_recepcion ? exp.fecha_recepcion.split('T')[0] : 'S/F' }})
              </option>
            </select>
          </div>

          <!-- Titular / Administrado -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Titular / Administrado <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.titular_id"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            >
              <option value="" disabled>Seleccione titular...</option>
              <option v-for="p in personasOptions" :key="p.id" :value="p.id">
                #{{ p.id }} - {{ p.nombres }} {{ p.apellido_paterno || '' }}
              </option>
            </select>
          </div>
        </div>

        <!-- Bloque 3: Clasificación Técnica (Riesgo y Zonificación) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Nivel de Riesgo ITSE -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Nivel de Riesgo ITSE <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.nivel_riesgo_id"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            >
              <option value="" disabled>Seleccione nivel de riesgo...</option>
              <option v-for="nr in nivelesRiesgoOptions" :key="nr.id" :value="nr.id">
                {{ nr.nombre }} ({{ nr.codigo }})
              </option>
            </select>
          </div>

          <!-- Zonificación -->
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Zonificación Territorial <span class="text-red-500">*</span>
            </label>
            <select
              v-model="form.zonificacion_id"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            >
              <option value="" disabled>Seleccione zonificación...</option>
              <option v-for="z in zonificacionesOptions" :key="z.id" :value="z.id">
                {{ z.codigo }} - {{ z.nombre }}
              </option>
            </select>
          </div>
        </div>

        <!-- Bloque 4: Datos del Establecimiento -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="sm:col-span-2">
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Dirección del Establecimiento
            </label>
            <input
              v-model="form.direccion"
              type="text"
              placeholder="Ej. Av. Nicolás de Piérola 450, Piso 1"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Área Ocupada (m²)
            </label>
            <input
              v-model="form.area"
              type="number"
              step="0.01"
              placeholder="Ej. 85.50"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <!-- Bloque 5: Actividad y Recibo de Pago -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Giro o Actividad Económica Declarada
            </label>
            <input
              v-model="form.actividad"
              type="text"
              placeholder="Ej. VENTA DE ABARROTES Y PRODUCTOS ALIMENTICIOS"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all uppercase text-neutral-800 dark:text-neutral-200"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              N° Recibo de Pago TUPA
            </label>
            <input
              v-model="form.numero_recibo_pago"
              type="text"
              placeholder="Ej. REC-2026-998"
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all font-mono text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <!-- Vigencia y Observaciones -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
          <label class="flex items-center gap-3 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-[#f4f4f4]/60 dark:bg-neutral-800/40 hover:bg-[#f4f4f4] dark:hover:bg-neutral-800 cursor-pointer transition-colors">
            <input
              v-model="form.es_vigencia_indeterminada"
              type="checkbox"
              class="w-4 h-4 text-[#0d6efd] rounded border-neutral-300 dark:border-neutral-700 focus:ring-blue-500"
            />
            <div>
              <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block">Vigencia Indeterminada (Ley Marco de Licencias N° 28976)</span>
              <span class="text-[11px] text-neutral-500 dark:text-neutral-400 block">La licencia no tiene fecha de caducidad temporal automática</span>
            </div>
          </label>

          <div>
            <label class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
              Observaciones del Trámite
            </label>
            <textarea
              v-model="form.observaciones"
              rows="2"
              placeholder="Anotaciones técnicas, condiciones especiales de operación o referencias..."
              class="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] transition-all resize-none text-neutral-800 dark:text-neutral-200"
            ></textarea>
          </div>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
