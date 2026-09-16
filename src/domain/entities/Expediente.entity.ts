/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/entities/Expediente.entity.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

export type EstadoExpediente = 'INGRESADO' | 'EN_EVALUACION' | 'OBSERVADO' | 'APROBADO' | 'RECHAZADO';

export interface Expediente {
  id: string;
  numero: string;
  fechaIngreso: Date;
  rucContribuyente: string;
  razonSocial: string;
  estado: EstadoExpediente;
}
