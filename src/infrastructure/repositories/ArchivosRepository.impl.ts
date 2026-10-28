import type { ArchivosRepositoryPort } from '../../domain/ports/ArchivosRepository.port';
import type { ArchivoAdjunto, ModuloArchivos } from '../../domain/entities/Archivo.entity';
import { httpClient } from '../http/axios.client';

export class ArchivosRepositoryImpl implements ArchivosRepositoryPort {
  async listar(modulo: ModuloArchivos, registroId: number): Promise<ArchivoAdjunto[]> {
    const { data } = await httpClient.get<ArchivoAdjunto[]>(`/lf-itse/${modulo}/${registroId}/archivos/`);
    return data;
  }

  async subir(modulo: ModuloArchivos, registroId: number, archivo: File, onProgreso?: (porcentaje: number) => void): Promise<ArchivoAdjunto> {
    const formulario = new FormData();
    formulario.append('archivo', archivo);
    const { data } = await httpClient.post<ArchivoAdjunto>(`/lf-itse/${modulo}/${registroId}/archivos/`, formulario, {
      // Obligatorio: el cliente usa JSON por defecto y axios convertiría el FormData en JSON
      // (el archivo se perdería). Con multipart, el navegador completa el "boundary".
      headers: { 'Content-Type': 'multipart/form-data' },
      // Las subidas pueden tardar más que el tiempo límite normal (fotos de varios MB)
      timeout: 120_000,
      onUploadProgress: (e) => {
        if (onProgreso && e.total) onProgreso(Math.round((e.loaded / e.total) * 100));
      },
    });
    return data;
  }

  async eliminar(modulo: ModuloArchivos, archivoId: number): Promise<void> {
    await httpClient.delete(`/lf-itse/${modulo}/archivos/${archivoId}/`);
  }

  async descargar(modulo: ModuloArchivos, uuid: string): Promise<Blob> {
    const { data } = await httpClient.get<Blob>(`/lf-itse/${modulo}/archivos/${uuid}/descargar/`, {
      responseType: 'blob',
      timeout: 120_000,
    });
    return data;
  }
}
