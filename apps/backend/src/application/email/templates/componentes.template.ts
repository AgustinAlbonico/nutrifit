import { MARCA, escaparHtml } from './base.template';

/**
 * Componentes HTML reutilizables para los templates de email.
 * Composición sobre herencia: cada helper devuelve un fragmento HTML email-safe.
 */

export function boton(href: string, texto: string): string {
  const hrefSeguro = escaparHtml(href);
  const textoSeguro = escaparHtml(texto);
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding-top:6px">
            <a href="${hrefSeguro}" target="_blank" style="display:inline-block;padding:14px 40px;background-color:${MARCA.carmesi};color:${MARCA.blanco};text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;letter-spacing:0.2px;border:2px solid ${MARCA.carmesi}">${textoSeguro}</a>
          </td>
        </tr>
      </table>`;
}

export function botonSecundario(href: string, texto: string): string {
  const hrefSeguro = escaparHtml(href);
  const textoSeguro = escaparHtml(texto);
  return `
            <a href="${hrefSeguro}" target="_blank" style="display:inline-block;padding:14px 30px;background-color:${MARCA.blanco};color:${MARCA.carbon};text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;border:2px solid ${MARCA.bordeFuerte}">${textoSeguro}</a>`;
}

export function botonera(
  primario: { href: string; texto: string },
  secundario?: { href: string; texto: string },
): string {
  const primarioHtml = `
            <a href="${escaparHtml(primario.href)}" target="_blank" style="display:inline-block;padding:14px 30px;background-color:${MARCA.carmesi};color:${MARCA.blanco};text-decoration:none;font-size:14px;font-weight:600;border-radius:8px;border:2px solid ${MARCA.carmesi}">${escaparHtml(primario.texto)}</a>`;
  const secundarioHtml = secundario
    ? botonSecundario(secundario.href, secundario.texto)
    : '';

  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:0 6px">${primarioHtml}</td>
                ${secundario ? `<td style="padding:0 6px">${secundarioHtml}</td>` : ''}
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
}

export interface DestacadoTurnoData {
  etiqueta: string;
  fecha: string;
  hora: string;
}

export function destacadoTurno(data: DestacadoTurnoData): string {
  const etiqueta = escaparHtml(data.etiqueta);
  const fecha = escaparHtml(data.fecha);
  const hora = escaparHtml(data.hora);
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px">
        <tr>
          <td style="background-color:${MARCA.carmesiSuave};border:1px solid #f3cdd0;border-radius:12px;padding:24px 20px;text-align:center">
            <p style="margin:0 0 6px;font-size:11px;color:${MARCA.carmesiProfundo};text-transform:uppercase;letter-spacing:1.6px;font-weight:700">${etiqueta}</p>
            <p style="margin:0;font-size:24px;font-weight:800;color:${MARCA.carbon};letter-spacing:-0.5px;line-height:1.2">${fecha}</p>
            <p style="margin:4px 0 0;font-size:17px;font-weight:600;color:${MARCA.carbonSuave}">${hora}</p>
          </td>
        </tr>
      </table>`;
}

export interface FilaDetalleData {
  icono: string;
  etiqueta: string;
  valor: string;
  extra?: string;
}

export function filaDetalle(data: FilaDetalleData): string {
  const etiqueta = escaparHtml(data.etiqueta);
  const valor = escaparHtml(data.valor);
  const extra = data.extra ? escaparHtml(data.extra) : '';
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px">
        <tr>
          <td style="background-color:${MARCA.cream};border:1px solid ${MARCA.borde};border-radius:10px;padding:14px 18px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="36" valign="middle" style="font-size:20px;line-height:1;padding-right:12px">${data.icono}</td>
                <td valign="middle">
                  <p style="margin:0;font-size:10px;color:${MARCA.textoMuted};text-transform:uppercase;letter-spacing:1.2px;font-weight:600">${etiqueta}</p>
                  <p style="margin:3px 0 0;font-size:15px;font-weight:600;color:${MARCA.carbon}">${valor}${extra ? ` <span style="font-weight:400;color:${MARCA.textoMuted};font-size:13px">${extra}</span>` : ''}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
}

export function aviso(titulo: string, texto: string): string {
  const tituloSeguro = escaparHtml(titulo);
  const textoSeguro = escaparHtml(texto);
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px">
        <tr>
          <td style="background-color:${MARCA.alertaBg};border:1px solid ${MARCA.alertaBorde};border-radius:10px;padding:16px 20px">
            <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:${MARCA.alertaTexto}">${tituloSeguro}</p>
            <p style="margin:0;font-size:13px;color:${MARCA.alertaTexto};line-height:1.55">${textoSeguro}</p>
          </td>
        </tr>
      </table>`;
}

export interface CredencialesCardData {
  etiqueta: string;
  usuario: string;
  contrasena: string;
}

export function credencialesCard(data: CredencialesCardData): string {
  const etiqueta = escaparHtml(data.etiqueta);
  const usuario = escaparHtml(data.usuario);
  const contrasena = escaparHtml(data.contrasena);
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:22px">
        <tr>
          <td style="background-color:${MARCA.cream};border:1px solid ${MARCA.borde};border-radius:12px;padding:20px 22px">
            <p style="margin:0 0 14px;font-size:10px;color:${MARCA.textoMuted};text-transform:uppercase;letter-spacing:1.6px;font-weight:700">${etiqueta}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="110" style="font-size:12px;color:${MARCA.textoMuted};padding:5px 0;font-weight:600">Usuario</td>
                <td style="font-size:14px;font-weight:600;color:${MARCA.carbon};padding:5px 0">${usuario}</td>
              </tr>
              <tr>
                <td width="110" style="font-size:12px;color:${MARCA.textoMuted};padding:5px 0;font-weight:600">Contrase&ntilde;a</td>
                <td style="font-size:15px;font-weight:700;color:${MARCA.carmesi};font-family:'Courier New',monospace;padding:5px 0">${contrasena}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
}

export function separador(): string {
  return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 18px">
        <tr>
          <td style="border-top:1px solid ${MARCA.borde};font-size:0;line-height:0">&nbsp;</td>
        </tr>
      </table>`;
}

export function parrafo(texto: string): string {
  return `
      <p style="margin:0 0 16px;font-size:15px;color:${MARCA.texto};line-height:1.65">${texto}</p>`;
}
