<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import Button from '../components/atoms/Button.vue';
import Input from '../components/atoms/Input.vue';

const authStore = useAuthStore();
const user = authStore.user;

const expedientesLF = ref<any[]>([]);
const lfData = ref({ nombreComercial: '', descripcion: '' });
const lcData = ref({ ubicacion: '', dimensiones: '' });

const loadData = async () => {
  try {
    const res = { data: [] };
    expedientesLF.value = res.data;
  } catch (e) {}
};

onMounted(() => {
  loadData();
});

const solicitarLF = async (e: Event) => {
  e.preventDefault();
  try {
    alert('Expediente LF ingresado. Proceda al pago.');
    loadData();
  } catch (err: any) {
    alert(err.response?.data?.error || 'Error al solicitar LF');
  }
};

const pagarLF = async (_id: number) => {
  alert('Pago realizado. Esperando asignación de inspector.');
  loadData();
};

const solicitarLC = async (e: Event) => {
  e.preventDefault();
  try {
    alert('Expediente de Construcción ingresado. Planos y dimensiones subidos.');
  } catch (err: any) {
    alert('Error');
  }
};
</script>

<template>
  <div>
    <div class="mb-6 p-4 bg-blue-100 rounded-lg text-blue-900 shadow-sm border border-blue-200">
      <span class="font-bold">Bienvenido, {{ user?.username }}</span> | RUC: {{ user?.ruc }}
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold mb-4 text-gray-800">1. Solicitar Licencia de Funcionamiento (LF)</h2>
        <form @submit="solicitarLF" class="space-y-4">
          <Input label="Nombre Comercial" v-model="lfData.nombreComercial" required />
          <Input label="Descripción del Establecimiento" v-model="lfData.descripcion" required />
          <Button type="submit">Presentar Expediente LF</Button>
        </form>
        
        <h3 class="font-bold mt-8 mb-4 border-t pt-4">Mis Trámites LF</h3>
        <div v-for="exp in expedientesLF" :key="exp.id" class="border p-4 mb-3 rounded bg-gray-50 flex flex-col gap-2">
          <div class="flex justify-between items-center">
            <span class="text-sm font-semibold">Expediente ID: {{ exp.id }}</span>
            <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">{{ exp.estado }}</span>
          </div>
          <Button v-if="exp.estado === 'INGRESADO'" @click="pagarLF(exp.id)" class="w-full text-xs mt-2">Pagar Tasa Municipal</Button>
          <p v-if="exp.inspeccion" class="text-sm text-gray-600 bg-yellow-50 p-2 rounded">
            Inspección programada para: <b>{{ exp.inspeccion.fecha }}</b>
          </p>
        </div>
        <p v-if="expedientesLF.length === 0" class="text-sm text-gray-500">No tienes trámites en curso.</p>
      </div>

      <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 class="text-xl font-bold mb-4 text-gray-800">2. Solicitar Licencia de Construcción (LC)</h2>
        <p class="text-sm text-gray-500 mb-4 bg-gray-50 p-3 rounded">Este trámite requiere evaluación de planos por Especialistas Externos.</p>
        <form @submit="solicitarLC" class="space-y-4">
          <Input label="Ubicación Geográfica" v-model="lcData.ubicacion" required />
          <Input label="Dimensiones / Área (m2)" v-model="lcData.dimensiones" required />
          <div class="p-4 border-2 border-dashed border-gray-300 rounded text-center text-sm text-gray-500">
            Drag & Drop de Planos (PDF/DWG)
          </div>
          <Button type="submit" variant="secondary" class="w-full">Adjuntar Planos y Solicitar LC</Button>
        </form>
      </div>
    </div>
  </div>
</template>
