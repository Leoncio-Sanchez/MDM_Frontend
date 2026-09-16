import os
import re

react_dir = '/home/leo/Documentos/Proyecto_Muni/frontend-reversed-pro_REACT_ARCHIVED_2026-09-16/src/presentation/pages'
vue_dir = 'src/presentation/pages'

pages = [
    'EstadosPage', 'ExpedientesPage', 'GirosPage', 'InspectoresPage', 'ItsePage',
    'LicenciasFuncionamientoPage', 'NivelesRiesgoPage', 'PersonasPage', 'TiposDocumentoIdentidadPage',
    'TiposLicenciaPage', 'TiposProcedimientoTupaPage', 'UnidadesOrganicasPage', 'UsuariosPage', 'ZonificacionesPage'
]

for page in pages:
    tsx_path = os.path.join(react_dir, f'{page}.tsx')
    with open(tsx_path, 'r') as f:
        content = f.read()

    # Extract entity name from filename (e.g. EstadosPage -> Estados)
    entity = page.replace('Page', '')
    
    # Extract columns
    cols_match = re.search(r'const columns = (\[.*?\]);', content, re.DOTALL)
    columns = cols_match.group(1) if cols_match else '[]'
    
    # Extract dummy data
    data_match = re.search(r'const displayData =.*?: (\[.*?\]);', content, re.DOTALL)
    display_data = data_match.group(1) if data_match else '[]'
    
    # Extract titles
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content)
    h1 = h1_match.group(1) if h1_match else f'Módulo de {entity}'
    
    p_match = re.search(r'<p[^>]*className="text-gray-500[^>]*>(.*?)</p>', content)
    p = p_match.group(1) if p_match else f'Gestión integral del dominio de {entity} municipal.'

    # Handle useModelList vs useExpedientes
    # The react hook is use{Entity}List except if it's named something else. Let's just match it.
    hook_match = re.search(r'use(\w+)List', content)
    hook_name = hook_match.group(0) if hook_match else f'use{entity}List'

    vue_template = f"""<script setup lang="ts">
import CrudTable from '../components/organisms/CrudTable.vue';
import {{ {hook_name}, useEliminar{entity} }} from '../../application/composables/use{entity}';

const {{ data, isLoading }} = {hook_name}();
const eliminar = useEliminar{entity}();

const handleAdd = () => alert('Abrir modal de creación para {entity}');
const handleEdit = (item: any) => alert('Abrir modal de edición para ' + item.id);
const handleDelete = (item: any) => {{
  eliminar.mutate(item.id, {{
    onSuccess: () => alert('Registro eliminado'),
    onError: (err: any) => alert('Error al eliminar: ' + err.message)
  }});
}};

const columns = {columns};

const getDisplayData = () => {{
  if (data.value && data.value.length > 0) return data.value;
  return {display_data};
}};
</script>

<template>
  <div class="p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 capitalize">{h1}</h1>
      <p class="text-gray-500 mt-2">{p}</p>
    </header>
    
    <CrudTable 
      title="Listado de Registros"
      :columns="columns"
      :data="getDisplayData()"
      :is-loading="isLoading"
      @add="handleAdd"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
"""
    with open(os.path.join(vue_dir, f'{page}.vue'), 'w') as f:
        f.write(vue_template)

print("Done")
