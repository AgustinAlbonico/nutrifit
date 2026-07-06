import { baseTemplate, escaparHtml } from './base.template';

export interface NuevoTurnoSocioTemplateData {
  nombreSocio: string;
  nombreNutricionista: string;
  fecha: string;
  hora: string;
  turnosUrl?: string;
}

export function nuevoTurnoSocioTemplate(
  data: NuevoTurnoSocioTemplateData,
): string {
  const fecha = escaparHtml(data.fecha);
  const hora = escaparHtml(data.hora);
  const nombreNutricionista = escaparHtml(data.nombreNutricionista);
  const turnosUrl = escaparHtml(
    data.turnosUrl ?? 'http://localhost:5173/turnos',
  );

  return baseTemplate({
    titulo: 'Turno confirmado',
    nombreDestinatario: data.nombreSocio,
    contenido: `
      <div style="background:#f5f5f5;border:1px solid #ebebeb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Detalles de tu turno confirmado</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#212121">${fecha}</p>
        <p style="margin:4px 0 0;font-size:16px;color:#212121">${hora}</p>
      </div>

      <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" valign="top" style="font-size:18px;line-height:1;padding:2px 12px 0 0">&#x1F464;</td>
            <td>
              <p style="margin:0;font-size:11px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Profesional</p>
              <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:#212121">Nut. ${nombreNutricionista}</p>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${turnosUrl}" style="display:inline-block;padding:12px 36px;background:#212121;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Ver mis turnos</a>
          </td>
        </tr>
      </table>
    `,
  });
}
