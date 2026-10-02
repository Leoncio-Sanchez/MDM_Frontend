export interface Giros {
  id: number;
  ciiu_id?: number | null;
  nombre: string;
  esta_activo: boolean;
  fecha_digitacion?: string;
  usuario?: number;
}
