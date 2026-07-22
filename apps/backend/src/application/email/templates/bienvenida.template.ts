import { baseTemplate, MARCA } from './base.template';
import {
  aviso,
  boton,
  credencialesCard,
  parrafo,
} from './componentes.template';

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
  const rolLabel = tituloPorRol(data.rol);
  const loginUrl = data.loginUrl ?? 'http://localhost:5173/login';

  return baseTemplate({
    titulo: 'Bienvenido a NutriFit Supervisor',
    nombreDestinatario: data.nombre,
    contenido: `
      ${parrafo(
        `Te damos la bienvenida a <strong style="color:${MARCA.carmesi}">NutriFit Supervisor</strong>. Tu cuenta fue creada como <strong>${rolLabel}</strong>.`,
      )}
      ${credencialesCard({
        etiqueta: 'Tus credenciales de acceso',
        usuario: data.email,
        contrasena: data.contrasenaProvisional,
      })}
      ${aviso(
        'Cambio de contrase&ntilde;a requerido',
        'Por seguridad, al ingresar por primera vez el sistema te pedir&aacute; que cambies tu contrase&ntilde;a.',
      )}
      ${boton(loginUrl, 'Ir al inicio de sesi&oacute;n')}`,
  });
}
