import type { ArchivoAdjunto, ModuloArchivos } from '../entities/Archivo.entity';

export interface ArchivosRepositoryPort {
  listar(modulo: ModuloArchivos, registroId: number): Promise<ArchivoAdjunto[]>;
  /** onProgreso recibe el porcentaje subido (0–100) */
  subir(modulo: ModuloArchivos, registroId: number, archivo: File, onProgreso?: (porcentaje: number) => void): Promise<ArchivoAdjunto>;
  eliminar(modulo: ModuloArchivos, archivoId: number): Promise<void>;
  /** El contenido del archivo (se pide con la sesión iniciada) */
  descargar(modulo: ModuloArchivos, uuid: string): Promise<Blob>;
}
