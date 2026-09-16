/**
 * @source golden-source
 * @origin reconstructed-frontend/src/domain/ports/ExternalServices.port.ts
 * @not-reverse-engineered true
 * @validated-against frontend/assets/index-8L03Lyao.js
 * @method Ruta A — Golden Source Validado
 */

export interface ReniecServicePort {
  consultarDNI(dni: string): Promise<{ nombres: string; apellidos: string }>;
}

export interface SunatServicePort {
  consultarRUC(ruc: string): Promise<{ razonSocial: string; direccion: string }>;
}
