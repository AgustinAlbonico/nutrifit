import { baseTemplate, escaparHtml } from './base.template';

export interface RecordatorioTemplateData {
  nombreSocio: string;
  nombreProfesional: string;
  fecha: string;
  hora: string;
  enlaceConfirmacion: string;
  enlaceCancelacion: string;
}

export function recordatorioTemplate(data: RecordatorioTemplateData): string {
  const fecha = escaparHtml(data.fecha);
  const hora = escaparHtml(data.hora);
  const nombreProfesional = escaparHtml(data.nombreProfesional);
  const enlaceConfirmacion = escaparHtml(data.enlaceConfirmacion);
  const enlaceCancelacion = escaparHtml(data.enlaceCancelacion);

  return baseTemplate({
    titulo: 'Recordatorio de turno',
    nombreDestinatario: data.nombreSocio,
    contenido: `
      <div style="background:#f5f5f5;border:1px solid #ebebeb;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center">
        <p style="margin:0 0 4px;font-size:12px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Turno programado</p>
        <p style="margin:0;font-size:22px;font-weight:700;color:#212121">${fecha}</p>
        <p style="margin:4px 0 0;font-size:16px;color:#212121">${hora}</p>
      </div>

      <div style="background:#f5f5f5;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="40" valign="top" style="font-size:18px;line-height:1;padding:2px 12px 0 0">&#x1F468;&#x200D;&#x2695;&#xFE0F;</td>
            <td>
              <p style="margin:0;font-size:11px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Profesional</p>
              <p style="margin:2px 0 0;font-size:15px;font-weight:600;color:#212121">${nombreProfesional}</p>
            </td>
          </tr>
        </table>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 6px">
                  <a href="${enlaceConfirmacion}" style="display:inline-block;padding:12px 28px;background:#212121;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Confirmar asistencia</a>
                </td>
                <td style="padding:0 6px">
                  <a href="${enlaceCancelacion}" style="display:inline-block;padding:12px 28px;background:#ffffff;color:#212121;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px;border:1px solid #d1d5db">Cancelar turno</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `,
  });
}
