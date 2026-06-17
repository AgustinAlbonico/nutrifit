export interface BaseTemplateData {
  titulo: string;
  contenido: string;
  nombreDestinatario: string;
}

const ENTIDADES_HTML: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escaparHtml(valor: string | number | null | undefined): string {
  return String(valor ?? '').replace(
    /[&<>"']/g,
    (caracter) => ENTIDADES_HTML[caracter],
  );
}

export function baseTemplate(data: BaseTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escaparHtml(data.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f5;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

          <!-- Header -->
          <tr>
            <td style="background-color:#212121;border-radius:8px 8px 0 0;padding:28px 40px;text-align:center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;width:48px;height:48px;background:rgba(255,255,255,0.1);border-radius:50%;line-height:48px;font-size:22px;margin-bottom:4px">&#x1F34A;</div>
                    <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">NutriFit</h1>
                    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.55);font-weight:400">Supervisor</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background:#ffffff;padding:36px 40px;border-radius:0 0 8px 8px;box-shadow:0 1px 3px rgba(0,0,0,0.08)">
              <p style="margin:0 0 20px;font-size:15px;color:#212121;line-height:1.6">
                Hola <strong>${escaparHtml(data.nombreDestinatario)}</strong>,
              </p>
              ${data.contenido}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 0;text-align:center">
              <p style="margin:0;font-size:12px;color:#8e8e8e;line-height:1.5">
                NutriFit Supervisor &mdash; Sistema de gesti&oacute;n de salud para gimnasios<br />
                Este es un mensaje autom&aacute;tico, por favor no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
