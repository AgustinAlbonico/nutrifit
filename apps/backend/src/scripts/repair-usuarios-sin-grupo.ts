import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

interface UsuarioSinGrupo {
  id_usuario: number;
  email: string;
  rol: string;
  gimnasio_id: number | null;
}

interface GrupoPermisoRow {
  id: number;
  clave: string;
}

const GRUPO_POR_ROL: Record<string, string> = {
  ADMIN: 'ADMIN',
  RECEPCIONISTA: 'RECEPCIONISTA',
  NUTRICIONISTA: 'NUTRICIONISTA',
  SOCIO: 'SOCIO',
};

async function main(): Promise<void> {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 3306),
    username: process.env.DATABASE_USER ?? 'root',
    password: process.env.DATABASE_PASSWORD ?? 'root',
    database: process.env.DATABASE_NAME ?? 'nutrifit_supervisor',
  });

  await dataSource.initialize();

  try {
    const usuariosSinGrupo = (await dataSource.query(
      `
        SELECT u.id_usuario, u.email, u.rol, p.id_gimnasio AS gimnasio_id
        FROM usuario u
        LEFT JOIN usuario_grupo_permiso ugp
          ON ugp.usuarioIdUsuario = u.id_usuario
        LEFT JOIN persona p
          ON p.id_persona = u.id_persona
        WHERE ugp.id_usuario_grupo_permiso IS NULL
          AND u.rol <> 'SUPERADMIN'
        ORDER BY u.id_usuario ASC
      `,
    )) as UsuarioSinGrupo[];

    if (usuariosSinGrupo.length === 0) {
      console.log(
        'repair-usuarios-sin-grupo: no hay usuarios sin grupo. Nada que reparar.',
      );
      return;
    }

    console.log(
      `repair-usuarios-sin-grupo: ${usuariosSinGrupo.length} usuario(s) sin grupo encontrado(s).`,
    );

    const grupos = (await dataSource.query(
      'SELECT id, clave FROM grupo_permiso',
    )) as GrupoPermisoRow[];
    const grupoIdPorClave = new Map(grupos.map((g) => [g.clave, g.id]));

    for (const usuario of usuariosSinGrupo) {
      const claveGrupo = GRUPO_POR_ROL[usuario.rol];
      if (!claveGrupo) {
        console.warn(
          `  - usuario ${usuario.id_usuario} (${usuario.email}) rol=${usuario.rol}: sin mapeo de grupo, se omite`,
        );
        continue;
      }

      const idGrupo = grupoIdPorClave.get(claveGrupo);
      if (idGrupo === undefined) {
        console.warn(
          `  - usuario ${usuario.id_usuario} (${usuario.email}) rol=${usuario.rol}: grupo ${claveGrupo} no existe en DB, se omite`,
        );
        continue;
      }

      const gimnasioId =
        usuario.rol === 'SOCIO' ? usuario.gimnasio_id ?? null : null;

      await dataSource.query(
        `
          INSERT INTO usuario_grupo_permiso (usuarioIdUsuario, grupoPermisoId, id_gimnasio, fecha_asignacion)
          VALUES (?, ?, ?, NOW())
        `,
        [usuario.id_usuario, idGrupo, gimnasioId],
      );

      console.log(
        `  + usuario ${usuario.id_usuario} (${usuario.email}) rol=${usuario.rol}: asignado grupo ${claveGrupo} (gimnasioId=${gimnasioId ?? 'NULL'})`,
      );
    }

    console.log('repair-usuarios-sin-grupo: reparación completa.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error('repair-usuarios-sin-grupo failed', error);
  process.exit(1);
});