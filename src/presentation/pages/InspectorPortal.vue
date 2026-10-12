<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Button from '../components/atoms/Button.vue';
import { useToast } from '../../infrastructure/store/useNotificationStore';

const expedientes = ref<any[]>([]);

const loadData = async () => {
  try {
    const res = { data: [] };
    expedientes.value = res.data;
  } catch (e) {}
};

onMounted(() => {
  loadData();
});

// TODO: portal inspector aún no conectado a la API (ver _docs/CHECKLIST_PENDIENTES.md).
const toast = useToast();

const inspeccionar = async (_id: number, _resultado: string) => {
  toast.info('Registrar el resultado de la inspección todavía no está conectado al sistema.', 'En construcción');
};
</script>

<template>
  <div class="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
    <h2 class="text-xl font-bold mb-6 text-slate-800">Mi Hoja de Ruta (Inspecciones ITSE)</h2>
    
    <div v-if="expedientes.length === 0" class="text-center p-8 text-slate-500">
      No tienes inspecciones asignadas hoy.
    </div>
    
    <div v-else v-for="exp in expedientes" :key="exp.id" class="border p-4 mb-4 rounded-lg bg-slate-50">
      <div class="mb-4">
        <p class="text-xs text-slate-500 uppercase tracking-wider font-bold">EXP-{{ exp.id }} • {{ exp.estado }}</p>
        <p class="text-lg font-bold text-slate-900 mt-1">{{ exp.nombreComercial || 'Local Comercial' }}</p>
        <p class="text-sm text-slate-600">Fecha Asignada: {{ exp.inspeccion?.fecha }}</p>
      </div>
      
      <div v-if="exp.estado === 'INSPECCION_PROGRAMADA'" class="flex flex-col sm:flex-row gap-2 mt-4">
        <Button @click="inspeccionar(exp.id, 'VISTO_BUENO')" class="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
          Visto Bueno (Cumple)
        </Button>
        <Button @click="inspeccionar(exp.id, 'OBSERVADO')" class="bg-red-600 hover:bg-red-700 w-full sm:w-auto">
          Observar (Faltan requisitos)
        </Button>
      </div>
      <div v-else class="mt-4 p-2 bg-slate-200 rounded text-slate-600 text-sm font-medium text-center">
        Inspección Completada
      </div>
    </div>
  </div>
</template>
