import { CreadoPor } from '../../../domain/entities/Turno/creado-por.enum';
import { baseTemplate, escaparHtml } from './base.template';

export interface NuevoTurnoNutriTemplateData {
  nombreNutricionista: string;
  nombreSocio: string;
  dniSocio?: string | null;
  fecha: string;
  hora: string;
  creadoPor: CreadoPor;
  agendaUrl?: string;
}

function mapearCreadoPor(creadoPor: CreadoPor): string {
  const mapa: Record<CreadoPor, string> = {
    [CreadoPor.RECEPCION]: 'Recepción',
    [CreadoPor.ADMIN]: 'Administración',
    [CreadoPor.NUTRICIONISTA]: 'el mismo profesional',
    [CreadoPor.SOCIO]: 'el socio',
  };
  return mapa[creadoPor] ?? 'Staff del gimnasio';
}

export function nuevoTurnoNutriTemplate(
  data: NuevoTurnoNutriTemplateData,
): string {
  const fecha = escaparHtml(data.fecha);
  const hora = escaparHtml(data.hora);
  const nombreSocio = escaparHtml(data.nombreSocio);
  const dniSocio = data.dniSocio ? escaparHtml(data.dniSocio) : null;
  const agendaUrl = escaparHtml(
    data.agendaUrl ?? 'http://localhost:5173/agenda',
  );

  return baseTemplate({
    titulo: 'Nuevo turno asignado',
    nombreDestinatario: data.nombreNutricionista,
    contenido: `
      <div style="background:#f5f5f5;border:1px solid #ebebeb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Nuevo turno en tu agenda</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#212121">${fecha}</p>
        <p style="margin:4px 0 0;font-size:16px;color:#212121">${hora}</p>
      </div>

      <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin-bottom:8px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" valign="top" style="font-size:18px;line-height:1;padding:2px 12px 0 0">&#x1F464;</td>
            <td>
              <p style="margin:0;font-size:11px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Paciente</p>
              <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:#212121">${nombreSocio}${dniSocio ? ` <span style="font-weight:400;color:#8e8e8e;font-size:13px">(DNI ${dniSocio})</span>` : ''}</p>
            </td>
          </tr>
        </table>
      </div>

      <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" valign="top" style="font-size:18px;line-height:1;padding:2px 12px 0 0">&#x1F4CB;</td>
            <td>
              <p style="margin:0;font-size:11px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Agendado por</p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:500;color:#212121">${mapearCreadoPor(data.creadoPor)}</p>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${agendaUrl}" style="display:inline-block;padding:12px 36px;background:#212121;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Ver en mi agenda</a>
          </td>
        </tr>
      </table>
    `,
  });
}
