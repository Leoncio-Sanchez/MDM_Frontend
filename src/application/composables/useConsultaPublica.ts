import { useMutation, useQuery } from '@tanstack/vue-query';
import { container } from '../../composition/container';
import { useAuthStore } from '../../infrastructure/store/useAuthStore';
import type { ConsultaPublicaParams, DatosCuentaCiudadano } from '../../domain/entities/ConsultaPublica.entity';

/** Consulta pública de un trámite (se ejecuta al enviar el formulario). */
export function useConsultaPublica() {
  return useMutation({
    mutationFn: (params: ConsultaPublicaParams) => container.consultaPublica.consultar(params),
  });
}

/** Todo lo que está a nombre del ciudadano con cuenta */
export function useMisTramites() {
  return useQuery({
    queryKey: ['ciudadano', 'mis-tramites'],
    queryFn: () => container.consultaPublica.misTramites(),
    // El estado cambia en la municipalidad: se vuelve a pedir al entrar
    staleTime: 0,
  });
}

/** Ingresar, crear la cuenta o restablecer la contraseña: las tres dejan la sesión iniciada */
export function useAccesoCiudadano() {
  const auth = useAuthStore();
  const guardar = (sesion: Awaited<ReturnType<typeof container.auth.ingresarCiudadano>>) => auth.setUser(sesion.user, sesion.token);

  return {
    ingresar: useMutation({
      mutationFn: ({ documento, clave }: { documento: string; clave: string }) => container.auth.ingresarCiudadano(documento, clave),
      onSuccess: guardar,
    }),
    registrar: useMutation({
      mutationFn: (datos: DatosCuentaCiudadano) => container.auth.registrarCiudadano(datos),
      onSuccess: guardar,
    }),
    restablecer: useMutation({
      mutationFn: (datos: DatosCuentaCiudadano) => container.auth.restablecerClaveCiudadano(datos),
      onSuccess: guardar,
    }),
  };
}
