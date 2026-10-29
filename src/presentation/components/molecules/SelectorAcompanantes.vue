<script setup lang="ts">
import { computed } from 'vue';
import { MAXIMO_ACOMPANANTES, type AcompananteInspeccion, type InspectorDisponible } from '../../../domain/entities/Inspecciones.entity';

/**
 * Casillas para elegir quiénes acompañan al inspector responsable. Muestra también a los
 * acompañantes actuales que ya no están activos, para poder quitarlos del equipo.
 */
const props = defineProps<{
  inspectores: InspectorDisponible[];
  /** El responsable no se ofrece como acompañante */
  responsableId: number | null;
  actuales?: AcompananteInspeccion[];
  idBase: string;
}>();
const seleccion = defineModel<number[]>({ required: true });

const opciones = computed(() => {
  const activos = props.inspectores.map((i) => ({
    id: i.id,
    nombre: i.nombre,
    detalle: `${i.pendientes} a cargo · ${i.acompanando} acompañando`,
  }));
  const desactivados = (props.actuales ?? [])
    .filter((a) => !activos.some((i) => i.id === a.id))
    .map((a) => ({ id: a.id, nombre: a.nombre, detalle: 'desactivado: quítelo del equipo' }));
  return [...activos, ...desactivados].filter((o) => o.id !== props.responsableId);
});

const elegidos = computed(() => seleccion.value.filter((id) => id !== props.responsableId));
const lleno = computed(() => elegidos.value.length >= MAXIMO_ACOMPANANTES);

const alternar = (id: number, marcado: boolean) => {
  seleccion.value = marcado ? [...seleccion.value, id] : seleccion.value.filter((x) => x !== id);
};
</script>

<template>
  <fieldset>
    <legend class="block text-xs font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-1.5">
      Acompañantes <span class="normal-case font-normal text-neutral-500 dark:text-neutral-400">(opcional, hasta {{ MAXIMO_ACOMPANANTES }})</span>
    </legend>
    <p v-if="opciones.length === 0" class="text-xs text-neutral-500 dark:text-neutral-400">No hay otros inspectores activos.</p>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label
        v-for="o in opciones"
        :key="o.id"
        :for="`${idBase}-${o.id}`"
        :class="[
          'flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm cursor-pointer transition-colors',
          elegidos.includes(o.id)
            ? 'border-[#0d6efd] bg-blue-50/70 dark:bg-blue-950/30'
            : 'border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/60',
          lleno && !elegidos.includes(o.id) && 'opacity-50 cursor-not-allowed',
        ]"
      >
        <input
          :id="`${idBase}-${o.id}`"
          type="checkbox"
          class="mt-0.5 accent-[#0d6efd]"
          :checked="elegidos.includes(o.id)"
          :disabled="lleno && !elegidos.includes(o.id)"
          @change="alternar(o.id, ($event.target as HTMLInputElement).checked)"
        />
        <span class="min-w-0">
          <span class="block font-semibold text-neutral-800 dark:text-neutral-100 truncate">{{ o.nombre }}</span>
          <span class="block text-[11px] text-neutral-500 dark:text-neutral-400">{{ o.detalle }}</span>
        </span>
      </label>
    </div>
    <span class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
      Los acompañantes ven la inspección en su bandeja; el acta la registra el responsable.
    </span>
  </fieldset>
</template>
