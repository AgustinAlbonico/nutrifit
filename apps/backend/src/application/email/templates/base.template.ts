/**
 * Paleta de marca NutriFit (alineada con el logo y el design system del frontend).
 * Source of truth para todos los templates de email.
 * Hex absoluto (no oklch) porque los clientes de mail no soportan oklch.
 */
export const MARCA = {
  carmesi: '#dc4249',
  carmesiProfundo: '#b8363c',
  carmesiSuave: '#fbe9ea',
  verde: '#64bc62',
  verdeProfundo: '#4f9e4d',
  verdeSuave: '#e8f5e9',
  carbon: '#2f2826',
  carbonSuave: '#5a4f4b',
  carbonMuted: '#8a7d77',
  cream: '#faf7f2',
  blanco: '#ffffff',
  borde: '#ece4dc',
  bordeFuerte: '#e0d6cb',
  texto: '#2f2826',
  textoMuted: '#8a7d77',
  alertaBg: '#fff4e0',
  alertaBorde: '#f0a93b',
  alertaTexto: '#8a5a12',
} as const;

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

/**
 * Construye la URL pública del logo del frontend.
 * Requiere FRONTEND_URL accesible desde internet (los clientes de mail
 * descargan la imagen; localhost no sirve en prod).
 */
export function construirUrlLogo(): string {
  const baseUrl = process.env.FRONTEND_URL?.trim() || 'http://localhost:5173';
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/logo.png`;
}

export function baseTemplate(data: BaseTemplateData): string {
  const logoUrl = escaparHtml(construirUrlLogo());

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light only" />
  <title>${escaparHtml(data.titulo)}</title>
</head>
<body style="margin:0;padding:0;background-color:${MARCA.cream};font-family:'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${MARCA.cream};padding:32px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${MARCA.blanco};border-radius:14px;overflow:hidden;box-shadow:0 4px 24px rgba(47,40,38,0.08)">

          <!-- Header -->
          <tr>
            <td style="background-color:${MARCA.carmesi};padding:30px 40px 26px;text-align:center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px">
                          <img src="${logoUrl}" alt="NutriFit" width="34" height="30" style="display:block;width:34px;height:30px;background-color:${MARCA.blanco};border-radius:9px;padding:6px;border:0;outline:none;text-decoration:none" />
                        </td>
                        <td style="vertical-align:middle;text-align:left">
                          <p style="margin:0;font-size:21px;font-weight:700;color:${MARCA.blanco};letter-spacing:-0.5px;line-height:1.1">NutriFit</p>
                          <p style="margin:2px 0 0;font-size:10px;font-weight:600;color:${MARCA.verdeSuave};text-transform:uppercase;letter-spacing:2.5px">Supervisor</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Acento verde de marca -->
          <tr>
            <td style="background-color:${MARCA.verde};font-size:0;line-height:0;height:4px">&nbsp;</td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="background-color:${MARCA.blanco};padding:38px 44px 8px">
              <p style="margin:0 0 22px;font-size:15px;color:${MARCA.texto};line-height:1.65">
                Hola <strong style="color:${MARCA.texto}">${escaparHtml(data.nombreDestinatario)}</strong>,
              </p>
              ${data.contenido}
            </td>
          </tr>

          <!-- Espaciado inferior del contenido -->
          <tr>
            <td style="background-color:${MARCA.blanco};padding:8px 44px 34px;font-size:0;line-height:0">&nbsp;</td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${MARCA.carbon};padding:26px 40px 28px;text-align:center">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${MARCA.blanco};letter-spacing:0.2px">NutriFit Supervisor</p>
              <p style="margin:0;font-size:12px;color:#b6a9a3;line-height:1.6">
                Sistema de gesti&oacute;n de salud para gimnasios<br />
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
