import type { ReportesRepositoryPort } from '../../domain/ports/ReportesRepository.port';
import type {
  InformePdf,
  PadronLicencias,
  ReporteBajas,
  ReporteImprocedentes,
  TipoAuditoria,
} from '../../domain/entities/Reportes.entity';
import { httpClient } from '../http/axios.client';

export class ReportesRepositoryImpl implements ReportesRepositoryPort {
  async padronLicencias(desde?: string, hasta?: string): Promise<PadronLicencias> {
    const { data } = await httpClient.get<PadronLicencias>('/lf-itse/reportes/licencias/', {
      params: desde && hasta ? { desde, hasta } : {},
    });
    return data;
  }

  async bajas(tipo: TipoAuditoria, desde: string, hasta: string): Promise<ReporteBajas> {
    const { data } = await httpClient.get<ReporteBajas>(`/lf-itse/reportes/bajas/${tipo}/`, { params: { desde, hasta } });
    return data;
  }

  async improcedentes(tipo: TipoAuditoria, desde: string, hasta: string): Promise<ReporteImprocedentes> {
    const { data } = await httpClient.get<ReporteImprocedentes>(`/lf-itse/reportes/improcedentes/${tipo}/`, { params: { desde, hasta } });
    return data;
  }

  async informeLicenciasPdf(desde: string, hasta: string): Promise<InformePdf> {
    try {
      const { data, headers } = await httpClient.get<Blob>('/lf-itse/reportes/licencias/pdf/', {
        params: { desde, hasta },
        responseType: 'blob',
        timeout: 120_000,
      });
      const nombre = /filename="([^"]+)"/.exec(String(headers['content-disposition'] ?? ''))?.[1];
      return {
        contenido: data,
        nombreArchivo: nombre ?? `informe_licencias_${desde.slice(0, 7)}.pdf`,
        codigo: String(headers['x-informe-codigo'] ?? ''),
        reimpresion: headers['x-informe-reimpresion'] === '1',
      };
    } catch (err) {
      // Con responseType 'blob' el error del servidor (JSON) también llega como Blob: se convierte
      // para que extractErrorMessage muestre el mensaje real ("elija un mes completo", etc.)
      const respuesta = (err as { response?: { data?: unknown } }).response;
      if (respuesta?.data instanceof Blob) {
        try {
          respuesta.data = JSON.parse(await respuesta.data.text());
        } catch {
          // no era JSON: se deja como está
        }
      }
      throw err;
    }
  }
}
