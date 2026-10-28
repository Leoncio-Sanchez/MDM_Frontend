import type { ContribuyenteSunat, PersonaReniec, PideServicePort } from '../../domain/ports/ExternalServices.port';
import { httpClient } from '../http/axios.client';

export class PideRepositoryImpl implements PideServicePort {
  async consultarDni(dni: string): Promise<PersonaReniec> {
    const { data } = await httpClient.get<PersonaReniec>('/lf-itse/reniec/consultar/', { params: { dni } });
    return data;
  }

  async consultarRuc(ruc: string): Promise<ContribuyenteSunat> {
    const { data } = await httpClient.get<ContribuyenteSunat>('/lf-itse/sunat/consultar/', { params: { ruc } });
    return data;
  }
}
