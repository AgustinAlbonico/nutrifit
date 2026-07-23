import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface UsuarioPrueba {
  email: string;
  password: string;
  rol: 'SUPERADMIN' | 'ADMIN' | 'RECEPCIONISTA' | 'NUTRICIONISTA' | 'SOCIO';
  nombre: string;
  gimnasio?: string;
}

function leerCredencialesSeed(): string {
  const ruta = join(process.cwd(), 'CREDENCIALES_SEED.md');
  return readFileSync(ruta, 'utf-8');
}

function extraerPasswordUniversal(markdown: string): string {
  const match = markdown.match(/Contraseña universal para todos los usuarios seed:\*\* `([^`]+)`/);
  return match?.[1] ?? '123456';
}

function extraerEmailPorRolYGimnasio(
  markdown: string,
  _rol: UsuarioPrueba['rol'],
  gimnasio: string,
): string {
  const gimnasioEscapado = gimnasio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\|\\s*\\*\\*${gimnasioEscapado}\\*\\*\\s*\\|\\s*[^|]+\\|\\s*\`([^\`]+)\``,
  );

  const match = markdown.match(pattern);
  if (!match?.[1]) {
    throw new Error(`No se encontró email seed para gimnasio=${gimnasio}`);
  }
  return match[1];
}

function extraerEmailPorGimnasioEnTabla(
  markdown: string,
  gimnasio: string,
  emailEsperadoParcial: string,
): string {
  const gimnasioEscapado = gimnasio.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parcialEscapado = emailEsperadoParcial.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `\\|\\s*\\*\\*${gimnasioEscapado}\\*\\*\\s*\\|\\s*(?:[^|]+\\|)?\\s*\`([^\`<]*${parcialEscapado}[^\`<]*)\``,
  );

  const match = markdown.match(pattern);
  if (!match?.[1]) {
    throw new Error(
      `No se encontró email seed para gimnasio=${gimnasio} parcial=${emailEsperadoParcial}`,
    );
  }

  return match[1];
}

function extraerEmailSuperadmin(markdown: string): string {
  const match = markdown.match(/\|\s*\*\*SUPERADMIN\*\*\s*\|\s*`([^`]+)`/);
  if (!match?.[1]) {
    throw new Error('No se encontró email seed de SUPERADMIN');
  }
  return match[1];
}

function crearUsuariosPrueba(): Record<string, UsuarioPrueba> {
  const markdown = leerCredencialesSeed();
  const password = extraerPasswordUniversal(markdown);

  return {
    SUPERADMIN: {
      email: extraerEmailSuperadmin(markdown),
      password,
      rol: 'SUPERADMIN',
      nombre: 'Super Admin',
    },
    ADMIN_CENTRAL: {
      email: extraerEmailPorRolYGimnasio(markdown, 'ADMIN', 'Gym Central'),
      password,
      rol: 'ADMIN',
      nombre: 'Admin Central',
      gimnasio: 'Gym Central',
    },
    RECEPCIONISTA_CENTRAL: {
      email: extraerEmailPorRolYGimnasio(
        markdown,
        'RECEPCIONISTA',
        'Gym Central',
      ),
      password,
      rol: 'RECEPCIONISTA',
      nombre: 'Recepcionista Central',
      gimnasio: 'Gym Central',
    },
    NUTRICIONISTA_CENTRAL: {
      email: extraerEmailPorGimnasioEnTabla(
        markdown,
        'Gym Central',
        'nutri-central@nutrifit.com',
      ),
      password,
      rol: 'NUTRICIONISTA',
      nombre: 'Nutricionista Central',
      gimnasio: 'Gym Central',
    },
    SOCIO_CENTRAL: {
      email: extraerEmailPorGimnasioEnTabla(
        markdown,
        'Gym Central',
        'socio1-central@nutrifit.com',
      ),
      password,
      rol: 'SOCIO',
      nombre: 'Socio 1 Central',
      gimnasio: 'Gym Central',
    },
  };
}

export const USUARIOS_PRUEBA = crearUsuariosPrueba();

export type { UsuarioPrueba };
