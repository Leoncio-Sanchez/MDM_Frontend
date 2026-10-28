import { useMutation } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import type { ConsultaPublicaParams } from '../../domain/entities/ConsultaPublica.entity';

/** Consulta pública de un trámite (se ejecuta al enviar el formulario). */
export function useConsultaPublica() {
  return useMutation({
    mutationFn: (params: ConsultaPublicaParams) => container.consultaPublica.consultar(params),
  });
}
