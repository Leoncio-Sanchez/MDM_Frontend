import { defineStore } from 'pinia';
import { ref } from 'vue';

export type NotifyVariant = 'success' | 'error' | 'warning' | 'info';
export type DialogVariant = NotifyVariant | 'question' | 'danger';

export interface Toast {
  id: number;
  variant: NotifyVariant;
  title?: string;
  message: string;
  duration: number;
}

export interface DialogOptions {
  title: string;
  text?: string;
  variant?: DialogVariant;
  confirmText?: string;
  /** Si se omite, el diálogo solo muestra el botón de aceptar. */
  cancelText?: string;
  /** Acción asíncrona: el diálogo muestra "procesando" y no se cierra hasta que termine. */
  onConfirm?: () => Promise<unknown> | unknown;
}

interface ActiveDialog extends DialogOptions {
  resolve: (confirmed: boolean) => void;
}

let nextToastId = 1;

export const useNotificationStore = defineStore('notifications', () => {
  const toasts = ref<Toast[]>([]);
  const dialog = ref<ActiveDialog | null>(null);
  const isDialogProcessing = ref(false);
  const dialogError = ref<string | null>(null);
  // Cola: si llega un diálogo mientras otro está abierto, espera su turno.
  const dialogQueue: ActiveDialog[] = [];

  function pushToast(variant: NotifyVariant, message: string, title?: string, duration = 4500) {
    const id = nextToastId++;
    toasts.value.push({ id, variant, title, message, duration });
    return id;
  }

  function dismissToast(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function openDialog(options: DialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      const entry: ActiveDialog = { ...options, resolve };
      if (dialog.value) {
        dialogQueue.push(entry);
      } else {
        dialog.value = entry;
      }
    });
  }

  function settleDialog(confirmed: boolean) {
    if (!dialog.value) return;
    dialog.value.resolve(confirmed);
    dialog.value = null;
    isDialogProcessing.value = false;
    dialogError.value = null;
    const next = dialogQueue.shift();
    if (next) dialog.value = next;
  }

  async function confirmDialog() {
    const current = dialog.value;
    if (!current || isDialogProcessing.value) return;
    if (!current.onConfirm) {
      settleDialog(true);
      return;
    }
    isDialogProcessing.value = true;
    dialogError.value = null;
    try {
      await current.onConfirm();
      settleDialog(true);
    } catch (err) {
      // El diálogo sigue abierto para que el usuario vea el error y decida.
      isDialogProcessing.value = false;
      dialogError.value = extractErrorMessage(err);
    }
  }

  function cancelDialog() {
    if (isDialogProcessing.value) return;
    settleDialog(false);
  }

  return {
    toasts,
    dialog,
    isDialogProcessing,
    dialogError,
    pushToast,
    dismissToast,
    openDialog,
    confirmDialog,
    cancelDialog,
  };
});

/** Obtiene un mensaje legible de un error de Axios / backend Laravel. */
export function extractErrorMessage(err: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  const e = err as any;
  const data = e?.response?.data;
  if (typeof data === 'string' && data.trim()) return data;
  return data?.message || data?.detail || data?.error || e?.message || fallback;
}

/**
 * Errores de validación por campo de Laravel (HTTP 422: `{ errors: { campo: ['msg'] } }`).
 * Devuelve el primer mensaje de cada campo. Los campos anidados quedan como `documentos.0.numero_documento`.
 */
export function extractFieldErrors(err: unknown): Record<string, string> {
  const errors = (err as any)?.response?.data?.errors;
  if (!errors || typeof errors !== 'object') return {};
  return Object.fromEntries(
    Object.entries(errors).map(([field, msgs]) => [field, Array.isArray(msgs) ? String(msgs[0]) : String(msgs)]),
  );
}

/** Notificaciones tipo toast (esquina superior derecha, se cierran solas). */
export function useToast() {
  const store = useNotificationStore();
  return {
    success: (message: string, title?: string) => store.pushToast('success', message, title),
    error: (message: string, title?: string) => store.pushToast('error', message, title, 7000),
    warning: (message: string, title?: string) => store.pushToast('warning', message, title, 6000),
    info: (message: string, title?: string) => store.pushToast('info', message, title),
    dismiss: (id: number) => store.dismissToast(id),
  };
}

/** Diálogos modales tipo SweetAlert. Devuelven una promesa: true si el usuario aceptó. */
export function useDialog() {
  const store = useNotificationStore();
  return {
    open: (options: DialogOptions) => store.openDialog(options),
    confirm: (options: Omit<DialogOptions, 'variant'> & { variant?: DialogVariant }) =>
      store.openDialog({ variant: 'question', confirmText: 'Sí, continuar', cancelText: 'Cancelar', ...options }),
    confirmDelete: (options: Omit<DialogOptions, 'variant'>) =>
      store.openDialog({ variant: 'danger', confirmText: 'Sí, eliminar', cancelText: 'Cancelar', ...options }),
    success: (title: string, text?: string) => store.openDialog({ variant: 'success', title, text, confirmText: 'Aceptar' }),
    error: (title: string, text?: string) => store.openDialog({ variant: 'error', title, text, confirmText: 'Entendido' }),
    warning: (title: string, text?: string) => store.openDialog({ variant: 'warning', title, text, confirmText: 'Entendido' }),
    info: (title: string, text?: string) => store.openDialog({ variant: 'info', title, text, confirmText: 'Aceptar' }),
  };
}
