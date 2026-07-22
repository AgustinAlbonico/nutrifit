import { baseTemplate, MARCA } from './base.template';
import {
  aviso,
  boton,
  credencialesCard,
  parrafo,
} from './componentes.template';

export interface CredencialesProvisionalesTemplateData {
  nombreDestinatario: string;
  email: string;
  contrasenaProvisional: string;
  rol: 'SOCIO' | 'NUTRICIONISTA' | 'RECEPCIONISTA';
  loginUrl?: string;
}

function etiquetaRol(rol: string): string {
  const mapa: Record<string, string> = {
    SOCIO: 'Socio',
    NUTRICIONISTA: 'Nutricionista',
    RECEPCIONISTA: 'Recepcionista',
    ADMIN: 'Administrador',
  };
  return mapa[rol] ?? 'Usuario';
}

export function credencialesProvisionalesTemplate(
  data: CredencialesProvisionalesTemplateData,
): string {
  const rolLabel = etiquetaRol(data.rol);
  const loginUrl = data.loginUrl ?? 'http://localhost:5173/login';

  return baseTemplate({
    titulo: 'Tus credenciales de acceso a NutriFit Supervisor',
    nombreDestinatario: data.nombreDestinatario,
    contenido: `
      ${parrafo(
        `Tus credenciales de acceso a <strong style="color:${MARCA.carmesi}">NutriFit Supervisor</strong> est&aacute;n listas. Tu cuenta fue creada con el rol <strong>${rolLabel}</strong>.`,
      )}
      ${credencialesCard({
        etiqueta: 'Credenciales provisorias',
        usuario: data.email,
        contrasena: data.contrasenaProvisional,
      })}
      ${aviso(
        'Importante',
        'Por seguridad, al ingresar por primera vez el sistema te pedir&aacute; que cambies tu contrase&ntilde;a. Si no reconoc&eacute;s este registro, contactanos respondiendo este email.',
      )}
      ${boton(loginUrl, 'Iniciar sesi&oacute;n')}`,
  });
}
