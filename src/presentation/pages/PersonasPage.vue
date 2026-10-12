<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  usePersonasList,
  useCrearPersonas,
  useActualizarPersonas,
  useEliminarPersonas,
  usePersonasSexos,
} from '../../application/composables/usePersonas';
import { useTiposDocumentoIdentidadList } from '../../application/composables/useTiposDocumentoIdentidad';
import { useFormDraft } from '../../application/composables/useFormDraft';
import CrudTable from '../components/organisms/CrudTable.vue';
import LargeModal from '../components/molecules/LargeModal.vue';
import { useToast, useDialog, extractErrorMessage, extractFieldErrors } from '../../infrastructure/store/useNotificationStore';
import type { Personas, PersonaPayload, TipoPersona, Sexo } from '../../domain/entities/Personas.entity';
import type { TiposDocumentoIdentidad } from '../../domain/entities/TiposDocumentoIdentidad.entity';

const { data, isLoading, error } = usePersonasList();
const { data: tiposDocumentoData } = useTiposDocumentoIdentidadList();
const { data: sexosData } = usePersonasSexos();

const crearPersona = useCrearPersonas();
const actualizarPersona = useActualizarPersonas();
const eliminar = useEliminarPersonas();
const toast = useToast();
const dialog = useDialog();

const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingId = ref<number | null>(null);
const formError = ref<string | null>(null);
const fieldErrors = ref<Record<string, string>>({});

// Códigos SUNAT de los documentos con longitud fija
const CODIGO_DNI = '01';
const CODIGO_RUC = '06';

interface DocumentoForm {
  tipo_documento_identidad_id: string | number;
  numero_documento: string;
}

const nuevoDocumento = (): DocumentoForm => ({ tipo_documento_identidad_id: '', numero_documento: '' });

const { form, hasDraft, clearDraft, setFormData, loadDraft } = useFormDraft({
  key: 'persona',
  initialData: {
    tipo_persona: 'N' as TipoPersona,
    sexo: '' as Sexo | '',
    nombres: '',
    apellido_paterno: '',
    apellido_materno: '',
    // Las filas se reemplazan siempre (nunca push) para no mutar este arreglo inicial compartido.
    documentos: [] as DocumentoForm[],
    direccion: '',
    distrito: '',
    provincia: '',
    departamento: '',
    telefono: '',
    correo_electronico: '',
  },
});

const isSubmitting = computed(() => crearPersona.isPending.value || actualizarPersona.isPending.value);
const esJuridica = computed(() => form.value.tipo_persona === 'J');

const listOf = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : (value as any)?.results ?? []);

const tiposDocumento = computed(() => listOf<TiposDocumentoIdentidad>(tiposDocumentoData.value));
const tiposDocumentoById = computed(() => new Map(tiposDocumento.value.map((t) => [t.id, t])));

/** Solo los tipos activos que aplican al tipo de persona elegido */
const tiposDocumentoOptions = computed(() =>
  tiposDocumento.value.filter((t) => t.esta_activo && (esJuridica.value ? t.es_para_juridica : t.es_para_natural)),
);

const sexosOptions = computed(() => (sexosData.value ?? []).filter((s) => s.value !== 'X' || !esJuridica.value));

const nombreCompleto = (p: Personas) =>
  p.tipo_persona === 'J'
    ? p.nombres
    : [p.nombres, p.apellido_paterno, p.apellido_materno].filter(Boolean).join(' ');

const documentosTexto = (p: Personas) =>
  (p.documentos ?? [])
    .map((d) => `${tiposDocumentoById.value.get(d.tipo_documento_identidad)?.nombre ?? 'DOC'} ${d.numero_documento}`)
    .join(' · ');

const columns = [
  { key: 'id', label: 'ID' },
  { key: 'tipo', label: 'TIPO' },
  { key: 'documentos', label: 'DOCUMENTO(S)' },
  { key: 'nombre', label: 'NOMBRES / RAZÓN SOCIAL' },
  { key: 'telefono', label: 'TELÉFONO' },
  { key: 'correo_electronico', label: 'CORREO' },
];

const displayData = computed(() =>
  listOf<Personas>(data.value).map((p) => ({
    id: p.id,
    tipo: p.tipo_persona === 'J' ? 'Jurídica' : 'Natural',
    documentos: documentosTexto(p),
    nombre: nombreCompleto(p),
    telefono: p.telefono ?? '',
    correo_electronico: p.correo_electronico ?? '',
    raw: p,
  })),
);

// Al cambiar a persona jurídica: sin apellidos, sexo "X" y solo documentos válidos para jurídicas
watch(
  () => form.value.tipo_persona,
  (tipo, anterior) => {
    if (!anterior || tipo === anterior) return;
    if (tipo === 'J') {
      form.value.apellido_paterno = '';
      form.value.apellido_materno = '';
      form.value.sexo = 'X';
    } else if (form.value.sexo === 'X') {
      form.value.sexo = '';
    }
    const permitidos = new Set(tiposDocumentoOptions.value.map((t) => t.id));
    const filtrados = form.value.documentos.filter(
      (d) => !d.tipo_documento_identidad_id || permitidos.has(Number(d.tipo_documento_identidad_id)),
    );
    form.value.documentos = filtrados.length ? filtrados : [nuevoDocumento()];
  },
);

const agregarDocumento = () => {
  form.value.documentos = [...form.value.documentos, nuevoDocumento()];
};

const quitarDocumento = (index: number) => {
  form.value.documentos = form.value.documentos.filter((_, i) => i !== index);
};

const longitudEsperada = (tipoId: string | number) => {
  const codigo = tiposDocumentoById.value.get(Number(tipoId))?.codigo;
  if (codigo === CODIGO_DNI) return 8;
  if (codigo === CODIGO_RUC) return 11;
  return null;
};

const fieldError = (campo: string) => fieldErrors.value[campo];

const resetErrors = () => {
  formError.value = null;
  fieldErrors.value = {};
};

const handleAdd = () => {
  isEditMode.value = false;
  editingId.value = null;
  resetErrors();
  loadDraft();
  if (!form.value.documentos?.length) form.value.documentos = [nuevoDocumento()];
  isModalOpen.value = true;
};

const handleDiscardDraft = () => {
  clearDraft();
  form.value.documentos = [nuevoDocumento()];
};

const handleEdit = (item: any) => {
  const p: Personas = item.raw;
  isEditMode.value = true;
  editingId.value = p.id;
  resetErrors();
  setFormData({
    tipo_persona: p.tipo_persona,
    sexo: p.sexo,
    nombres: p.nombres ?? '',
    apellido_paterno: p.apellido_paterno ?? '',
    apellido_materno: p.apellido_materno ?? '',
    documentos: (p.documentos ?? []).map((d) => ({
      tipo_documento_identidad_id: d.tipo_documento_identidad,
      numero_documento: d.numero_documento,
    })),
    direccion: p.direccion ?? '',
    distrito: p.distrito ?? '',
    provincia: p.provincia ?? '',
    departamento: p.departamento ?? '',
    telefono: p.telefono ?? '',
    correo_electronico: p.correo_electronico ?? '',
  });
  if (!form.value.documentos.length) form.value.documentos = [nuevoDocumento()];
  isModalOpen.value = true;
};

const handleDelete = async (item: any) => {
  const ok = await dialog.confirmDelete({
    title: 'Confirmar eliminación',
    text: `¿Está seguro de eliminar a "${item.nombre}"?\nNo se podrá eliminar si tiene expedientes, licencias o ITSE asociados.`,
    onConfirm: () => eliminar.mutateAsync(item.id),
  });
  if (ok) toast.success('La persona se eliminó correctamente.');
};

/** Validación en el cliente. Devuelve el primer mensaje de error o null. */
const validar = (): string | null => {
  const f = form.value;
  if (!f.nombres.trim()) return esJuridica.value ? 'La razón social es obligatoria.' : 'Los nombres son obligatorios.';
  if (!esJuridica.value && !f.apellido_paterno.trim()) return 'El apellido paterno es obligatorio.';
  if (!f.sexo) return 'Seleccione el sexo.';

  const docs = f.documentos.filter((d) => d.tipo_documento_identidad_id || d.numero_documento.trim());
  if (!docs.length) return 'Registre al menos un documento de identidad.';

  const tiposUsados = new Set<number>();
  for (const d of docs) {
    if (!d.tipo_documento_identidad_id) return 'Seleccione el tipo de cada documento.';
    const numero = d.numero_documento.trim();
    if (!numero) return 'Ingrese el número de cada documento.';
    const tipoId = Number(d.tipo_documento_identidad_id);
    if (tiposUsados.has(tipoId)) return 'No repita el mismo tipo de documento.';
    tiposUsados.add(tipoId);
    const largo = longitudEsperada(tipoId);
    const nombreTipo = tiposDocumentoById.value.get(tipoId)?.nombre ?? 'documento';
    if (largo && !new RegExp(`^\\d{${largo}}$`).test(numero)) {
      return `El ${nombreTipo} debe tener exactamente ${largo} dígitos.`;
    }
  }

  if (esJuridica.value) {
    const tieneRuc = docs.some((d) => tiposDocumentoById.value.get(Number(d.tipo_documento_identidad_id))?.codigo === CODIGO_RUC);
    if (!tieneRuc) return 'Una persona jurídica debe registrar su RUC.';
  }
  return null;
};

const texto = (v: string) => v.trim() || null;

const construirPayload = (): PersonaPayload => {
  const f = form.value;
  return {
    tipo_persona: f.tipo_persona,
    sexo: (esJuridica.value ? 'X' : f.sexo) as Sexo,
    nombres: f.nombres.trim().toUpperCase(),
    apellido_paterno: esJuridica.value ? null : f.apellido_paterno.trim().toUpperCase() || null,
    apellido_materno: esJuridica.value ? null : f.apellido_materno.trim().toUpperCase() || null,
    direccion: texto(f.direccion),
    distrito: texto(f.distrito),
    provincia: texto(f.provincia),
    departamento: texto(f.departamento),
    telefono: texto(f.telefono),
    correo_electronico: texto(f.correo_electronico),
    documentos: f.documentos
      .filter((d) => d.tipo_documento_identidad_id && d.numero_documento.trim())
      .map((d) => ({
        tipo_documento_identidad_id: Number(d.tipo_documento_identidad_id),
        numero_documento: d.numero_documento.trim(),
      })),
  };
};

const onError = (fallback: string) => (err: any) => {
  fieldErrors.value = extractFieldErrors(err);
  formError.value = Object.keys(fieldErrors.value).length
    ? 'Revise los campos marcados en rojo.'
    : extractErrorMessage(err, fallback);
};

const handleSubmit = () => {
  resetErrors();
  const mensaje = validar();
  if (mensaje) {
    formError.value = mensaje;
    return;
  }
  const payload = construirPayload();

  if (isEditMode.value && editingId.value) {
    actualizarPersona.mutate(
      { id: editingId.value, data: payload },
      {
        onSuccess: () => {
          clearDraft();
          isModalOpen.value = false;
          toast.success('Los cambios se guardaron correctamente.');
        },
        onError: onError('Error al actualizar la persona'),
      },
    );
  } else {
    crearPersona.mutate(payload, {
      onSuccess: () => {
        clearDraft();
        isModalOpen.value = false;
        toast.success('La persona se registró correctamente.');
      },
      onError: onError('Error al registrar la persona'),
    });
  }
};

const labelClass = 'block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5';
const inputClass =
  'w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0d6efd] bg-white dark:bg-[#18181b] text-neutral-800 dark:text-neutral-200 disabled:bg-neutral-100 dark:disabled:bg-neutral-800 disabled:cursor-not-allowed transition-all';
const errorInputClass = 'border-red-400 dark:border-red-700 focus:border-red-500 focus:ring-red-500/20';
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="p-4 text-center text-red-600 font-semibold mb-4 bg-red-50 border border-red-200 rounded-xl">
      Error al cargar personas: {{ error.message }}
    </div>

    <CrudTable
      title="Padrón General de Ciudadanos y Personas Jurídicas"
      :columns="columns"
      :data="displayData"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />

    <LargeModal
      v-model="isModalOpen"
      :title="isEditMode ? 'Editar Persona' : 'Registrar Nueva Persona'"
      :subtitle="isEditMode ? `Modificando Persona #${editingId}` : 'Datos de identificación y contacto del administrado'"
      maxWidth="max-w-3xl"
      :is-loading="isSubmitting"
      :is-edit-mode="isEditMode"
      :has-draft="hasDraft"
      :submit-text="isEditMode ? 'Guardar Cambios' : 'Registrar Persona'"
      @submit="handleSubmit"
      @discard-draft="handleDiscardDraft"
    >
      <!-- Alerta de Error de Validación -->
      <div v-if="formError" class="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium rounded-xl flex items-center gap-2" role="alert">
        <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formError }}</span>
      </div>

      <div class="space-y-4">
        <!-- Bloque 1: Tipo de persona -->
        <div>
          <span :class="labelClass">Tipo de Persona <span class="text-red-500">*</span></span>
          <div class="grid grid-cols-2 gap-2 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700">
            <button
              v-for="opt in [{ value: 'N', label: 'Persona Natural' }, { value: 'J', label: 'Persona Jurídica' }]"
              :key="opt.value"
              type="button"
              @click="form.tipo_persona = opt.value as TipoPersona"
              :class="[
                'py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                form.tipo_persona === opt.value
                  ? 'bg-white dark:bg-[#18181b] text-[#0d6efd] dark:text-blue-400 shadow-xs border border-neutral-200 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200',
              ]"
              :aria-pressed="form.tipo_persona === opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- Bloque 2: Nombres -->
        <div v-if="esJuridica">
          <label :class="labelClass" for="persona-nombres">Razón Social <span class="text-red-500">*</span></label>
          <input
            id="persona-nombres"
            v-model="form.nombres"
            type="text"
            maxlength="100"
            placeholder="Ej. INVERSIONES SANTA ROSA S.A.C."
            :class="[inputClass, 'uppercase font-medium', fieldError('nombres') ? errorInputClass : '']"
          />
          <p v-if="fieldError('nombres')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('nombres') }}</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label :class="labelClass" for="persona-nombres">Nombres <span class="text-red-500">*</span></label>
            <input
              id="persona-nombres"
              v-model="form.nombres"
              type="text"
              maxlength="100"
              placeholder="Ej. JUAN CARLOS"
              :class="[inputClass, 'uppercase', fieldError('nombres') ? errorInputClass : '']"
            />
            <p v-if="fieldError('nombres')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('nombres') }}</p>
          </div>
          <div>
            <label :class="labelClass" for="persona-ap-paterno">Apellido Paterno <span class="text-red-500">*</span></label>
            <input
              id="persona-ap-paterno"
              v-model="form.apellido_paterno"
              type="text"
              maxlength="50"
              placeholder="Ej. QUISPE"
              :class="[inputClass, 'uppercase', fieldError('apellido_paterno') ? errorInputClass : '']"
            />
          </div>
          <div>
            <label :class="labelClass" for="persona-ap-materno">Apellido Materno</label>
            <input
              id="persona-ap-materno"
              v-model="form.apellido_materno"
              type="text"
              maxlength="50"
              placeholder="Ej. MAMANI"
              :class="[inputClass, 'uppercase', fieldError('apellido_materno') ? errorInputClass : '']"
            />
          </div>
        </div>

        <!-- Sexo (solo personas naturales) -->
        <div v-if="!esJuridica" class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label :class="labelClass" for="persona-sexo">Sexo <span class="text-red-500">*</span></label>
            <select id="persona-sexo" v-model="form.sexo" :class="[inputClass, fieldError('sexo') ? errorInputClass : '']">
              <option value="" disabled>Seleccione...</option>
              <option v-for="s in sexosOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
          </div>
        </div>

        <!-- Bloque 3: Documentos de identidad -->
        <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div class="flex items-center justify-between mb-2">
            <span :class="[labelClass, 'mb-0']">Documentos de Identidad <span class="text-red-500">*</span></span>
            <button
              type="button"
              @click="agregarDocumento"
              :disabled="form.documentos.length >= tiposDocumentoOptions.length"
              class="px-2.5 py-1 text-[11px] font-semibold text-[#0d6efd] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Agregar documento
            </button>
          </div>

          <p v-if="!tiposDocumentoOptions.length" class="text-xs text-amber-700 dark:text-amber-400 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            No hay tipos de documento activos para este tipo de persona. Regístrelos en Catálogos → Tipos de Documento.
          </p>

          <div class="space-y-2">
            <div v-for="(doc, i) in form.documentos" :key="i" class="grid grid-cols-[1fr_1fr_auto] gap-2 items-start">
              <select
                v-model="doc.tipo_documento_identidad_id"
                :aria-label="`Tipo del documento ${i + 1}`"
                :class="[inputClass, fieldError(`documentos.${i}.tipo_documento_identidad_id`) ? errorInputClass : '']"
              >
                <option value="" disabled>Tipo de documento...</option>
                <option v-for="t in tiposDocumentoOptions" :key="t.id" :value="t.id">{{ t.nombre }}</option>
              </select>
              <div>
                <input
                  v-model="doc.numero_documento"
                  type="text"
                  inputmode="numeric"
                  :maxlength="longitudEsperada(doc.tipo_documento_identidad_id) ?? 20"
                  :placeholder="longitudEsperada(doc.tipo_documento_identidad_id) ? `${longitudEsperada(doc.tipo_documento_identidad_id)} dígitos` : 'Número'"
                  :aria-label="`Número del documento ${i + 1}`"
                  :class="[inputClass, 'font-mono', fieldError(`documentos.${i}.numero_documento`) ? errorInputClass : '']"
                />
                <p v-if="fieldError(`documentos.${i}.numero_documento`)" class="text-[11px] text-red-600 dark:text-red-400 mt-1">
                  {{ fieldError(`documentos.${i}.numero_documento`) }}
                </p>
              </div>
              <button
                type="button"
                @click="quitarDocumento(i)"
                :disabled="form.documentos.length === 1"
                class="mt-1 p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                :aria-label="`Quitar documento ${i + 1}`"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Bloque 4: Contacto -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <label :class="labelClass" for="persona-telefono">Teléfono / Celular</label>
            <input id="persona-telefono" v-model="form.telefono" type="tel" maxlength="30" placeholder="Ej. 987 654 321" :class="[inputClass, fieldError('telefono') ? errorInputClass : '']" />
          </div>
          <div>
            <label :class="labelClass" for="persona-correo">Correo Electrónico</label>
            <input
              id="persona-correo"
              v-model="form.correo_electronico"
              type="email"
              maxlength="150"
              placeholder="Ej. contacto@empresa.pe"
              :class="[inputClass, fieldError('correo_electronico') ? errorInputClass : '']"
            />
            <p v-if="fieldError('correo_electronico')" class="text-[11px] text-red-600 dark:text-red-400 mt-1">{{ fieldError('correo_electronico') }}</p>
          </div>
        </div>

        <!-- Bloque 5: Domicilio -->
        <div>
          <label :class="labelClass" for="persona-direccion">Dirección / Domicilio Fiscal</label>
          <input id="persona-direccion" v-model="form.direccion" type="text" maxlength="250" placeholder="Ej. Jr. Lima 123, Cercado" :class="inputClass" />
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label :class="labelClass" for="persona-distrito">Distrito</label>
            <input id="persona-distrito" v-model="form.distrito" type="text" maxlength="100" :class="[inputClass, 'uppercase']" />
          </div>
          <div>
            <label :class="labelClass" for="persona-provincia">Provincia</label>
            <input id="persona-provincia" v-model="form.provincia" type="text" maxlength="100" :class="[inputClass, 'uppercase']" />
          </div>
          <div>
            <label :class="labelClass" for="persona-departamento">Departamento</label>
            <input id="persona-departamento" v-model="form.departamento" type="text" maxlength="100" :class="[inputClass, 'uppercase']" />
          </div>
        </div>
      </div>
    </LargeModal>
  </div>
</template>
