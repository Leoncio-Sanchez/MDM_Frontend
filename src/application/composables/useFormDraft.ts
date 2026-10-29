import { ref, watch, onMounted } from 'vue';

export interface UseFormDraftOptions<T> {
  /** Clave única de almacenamiento en localStorage (ej. 'expedientes', 'estados') */
  key: string;
  /** Datos iniciales por defecto */
  initialData: T;
  /** Tiempo de espera de debounce en ms (por defecto: 300ms) */
  debounceMs?: number;
}

export function useFormDraft<T extends Record<string, any>>(options: UseFormDraftOptions<T>) {
  const { key, initialData, debounceMs = 300 } = options;
  const storageKey = `muni_draft_${key}`;
  
  const form = ref<T>({ ...initialData });
  const hasDraft = ref(false);
  const lastSavedAt = ref<string | null>(null);

  // Cargar borrador si existe en localStorage
  const loadDraft = (): boolean => {
    editandoExistente = false;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.data) {
          form.value = { ...initialData, ...parsed.data };
          hasDraft.value = true;
          lastSavedAt.value = parsed.savedAt || null;
          return true;
        }
      }
    } catch (e) {
      console.warn('Error al cargar borrador de formulario desde localStorage:', e);
    }
    hasDraft.value = false;
    return false;
  };

  // Guardar en localStorage con debounce
  let timeoutId: any = null;
  const saveDraft = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      try {
        const payload = {
          data: form.value,
          savedAt: new Date().toISOString()
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
        hasDraft.value = true;
        lastSavedAt.value = payload.savedAt;
      } catch (e) {
        console.warn('Error al persistir borrador de formulario:', e);
      }
    }, debounceMs);
  };

  // El reinicio del formulario no es un cambio del usuario: no debe volver a guardarse
  // como borrador (si no, el siguiente formulario se abre con esos valores viejos)
  let omitirSiguienteGuardado = false;
  // Editando un registro que ya existe no se guarda borrador: si se cierra sin guardar,
  // el próximo "Nuevo" se abriría con los datos de ese registro
  let editandoExistente = false;

  // Descartar y limpiar borrador
  const clearDraft = () => {
    clearTimeout(timeoutId);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {}
    hasDraft.value = false;
    lastSavedAt.value = null;
    omitirSiguienteGuardado = true;
    editandoExistente = false;
    form.value = { ...initialData };
  };

  // Cargar datos en el formulario (ej. al abrir modal para editar)
  const setFormData = (data: Partial<T>, clearStoredDraft = true) => {
    clearTimeout(timeoutId);
    if (clearStoredDraft) {
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {}
      hasDraft.value = false;
      lastSavedAt.value = null;
      omitirSiguienteGuardado = true;
      editandoExistente = true;
    }
    form.value = { ...initialData, ...data };
  };

  // Vigilancia profunda reactiva para auto-guardado
  watch(
    form,
    () => {
      if (omitirSiguienteGuardado) {
        omitirSiguienteGuardado = false;
        return;
      }
      if (editandoExistente) return;
      saveDraft();
    },
    { deep: true }
  );

  onMounted(() => {
    loadDraft();
  });

  return {
    form,
    hasDraft,
    lastSavedAt,
    loadDraft,
    clearDraft,
    setFormData,
    saveDraft
  };
}
