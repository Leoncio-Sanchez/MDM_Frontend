import { useMutation } from '@tanstack/vue-query';
import { container } from '../../composition/container';

/** Consulta un DNI en RENIEC (se ejecuta a pedido, al pulsar "Consultar"). */
export function useConsultarDni() {
  return useMutation({ mutationFn: (dni: string) => container.pide.consultarDni(dni) });
}

/** Consulta un RUC en SUNAT (se ejecuta a pedido, al pulsar "Consultar"). */
export function useConsultarRuc() {
  return useMutation({ mutationFn: (ruc: string) => container.pide.consultarRuc(ruc) });
}
