import { baseTemplate, escaparHtml } from './base.template';

export interface BienvenidaTemplateData {
  nombre: string;
  email: string;
  contrasenaProvisional: string;
  rol: string;
  loginUrl?: string;
}

function tituloPorRol(rol: string): string {
  const mapa: Record<string, string> = {
    ADMIN: 'Administrador de gimnasio',
    NUTRICIONISTA: 'Nutricionista',
    RECEPCIONISTA: 'Recepcionista',
    SOCIO: 'Socio',
  };
  return mapa[rol] ?? 'Usuario';
}

export function bienvenidaTemplate(data: BienvenidaTemplateData): string {
  const rolLabel = escaparHtml(tituloPorRol(data.rol));
  const email = escaparHtml(data.email);
  const contrasenaProvisional = escaparHtml(data.contrasenaProvisional);
  const loginUrl = escaparHtml(data.loginUrl ?? 'http://localhost:5173/login');

  return baseTemplate({
    titulo: 'Bienvenido a NutriFit Supervisor',
    nombreDestinatario: data.nombre,
    contenido: `
      <p style="margin:0 0 20px;font-size:15px;color:#212121;line-height:1.6">
        Te damos la bienvenida a <strong>NutriFit Supervisor</strong>. Tu cuenta ha sido creada como <strong>${rolLabel}</strong>.
      </p>

      <div style="background:#f5f5f5;border:1px solid #ebebeb;border-radius:8px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 12px;font-size:12px;color:#8e8e8e;text-transform:uppercase;letter-spacing:1px">Tus credenciales de acceso</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="80" style="font-size:13px;color:#8e8e8e;padding:4px 0">Usuario:</td>
            <td style="font-size:14px;font-weight:600;color:#212121;padding:4px 0">${email}</td>
          </tr>
          <tr>
            <td width="80" style="font-size:13px;color:#8e8e8e;padding:4px 0">Contraseña:</td>
            <td style="font-size:14px;font-weight:700;color:#212121;font-family:'Courier New',monospace;padding:4px 0">${contrasenaProvisional}</td>
          </tr>
        </table>
      </div>

      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px 20px;margin-bottom:24px">
        <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#856404">&#x26A0;&#xFE0F; Cambio de contraseña requerido</p>
        <p style="margin:0;font-size:13px;color:#856404;line-height:1.5">
          Por seguridad, debes cambiar tu contraseña al ingresar por primera vez al sistema.
          Ingresá al sistema e iniciá sesión con estas credenciales.
        </p>
      </div>

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center">
            <a href="${loginUrl}" style="display:inline-block;padding:12px 36px;background:#212121;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;border-radius:6px">Ir al inicio de sesión</a>
          </td>
        </tr>
      </table>
    `,
  });
}
