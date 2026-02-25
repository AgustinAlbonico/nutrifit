import 'reflect-metadata';
import { DataSource } from 'typeorm';
import type { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as Minio from 'minio';

// Cargar variables de entorno
dotenv.config({ path: '.env' });

async function runSeed() {
  console.log('Iniciando seed de permisos y usuarios...');

  const options: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    synchronize: false,
    logging: false,
  };

  const dataSource = new DataSource(options);

  const obtenerInsertId = (resultado: unknown): number | null => {
    if (typeof resultado !== 'object' || resultado === null) {
      return null;
    }

    const registro = resultado as Record<string, unknown>;
    return typeof registro.insertId === 'number' ? registro.insertId : null;
  };

  const parsearNumero = (valor: unknown): number | null => {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor;
    }

    if (typeof valor === 'string' && valor.trim() !== '') {
      const numero = Number(valor);
      return Number.isFinite(numero) ? numero : null;
    }

    return null;
  };

  const obtenerPrimeraFila = (
    resultado: unknown,
  ): Record<string, unknown> | null => {
    if (!Array.isArray(resultado) || resultado.length === 0) {
      return null;
    }

    const filas = resultado as unknown[];
    const fila = filas[0];

    if (typeof fila !== 'object' || fila === null) {
      return null;
    }

    return fila as Record<string, unknown>;
  };

  const generarImagenAvatar = (
    nombre: string,
    apellido: string,
    genero: 'MASCULINO' | 'FEMENINO' | 'OTRO',
  ): Buffer => {
    // Crear un SVG simple con iniciales
    const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

    // Colores según género
    const colores: Record<string, string> = {
      MASCULINO: '#3B82F6', // azul
      FEMENINO: '#EC4899', // rosa
      OTRO: '#8B5CF6', // violeta
    };

    const colorFondo = colores[genero] || colores.OTRO;

    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <circle cx="100" cy="100" r="100" fill="${colorFondo}"/>
        <text x="100" y="100" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${iniciales}</text>
      </svg>
    `;

    return Buffer.from(svg);
  };

  const subirImagenPorDefecto = async (
    minioClient: Minio.Client,
    bucketName: string,
    key: string,
    nombre: string,
    apellido: string,
    genero: 'MASCULINO' | 'FEMENINO' | 'OTRO',
  ): Promise<void> => {
    const imagenBuffer = generarImagenAvatar(nombre, apellido, genero);

    await minioClient.putObject(
      bucketName,
      key,
      imagenBuffer,
      imagenBuffer.length,
      {
        'Content-Type': 'image/svg+xml',
      },
    );

    console.log(`   📷 Imagen subida: ${key}`);
  };

  const obtenerUsuarioExistente = (
    resultado: unknown,
  ): { idUsuario: number; idPersona: number | null } | null => {
    const fila = obtenerPrimeraFila(resultado);

    if (!fila) {
      return null;
    }

    const idUsuario = parsearNumero(fila.id_usuario);

    if (!idUsuario) {
      return null;
    }

    return {
      idUsuario,
      idPersona: parsearNumero(fila.id_persona),
    };
  };

  const accionesProfesional = [
    {
      clave: 'turnos.ver',
      nombre: 'Ver turnos',
      descripcion: 'Permite ver la lista de turnos',
    },
    {
      clave: 'turnos.crear',
      nombre: 'Crear turnos',
      descripcion: 'Permite crear nuevos turnos',
    },
    {
      clave: 'turnos.editar',
      nombre: 'Editar turnos',
      descripcion: 'Permite editar turnos existentes',
    },
    {
      clave: 'turnos.eliminar',
      nombre: 'Eliminar turnos',
      descripcion: 'Permite eliminar turnos',
    },
    {
      clave: 'socios.ver',
      nombre: 'Ver socios',
      descripcion: 'Permite ver la lista de socios',
    },
    {
      clave: 'agenda.ver',
      nombre: 'Ver agenda',
      descripcion: 'Permite ver la agenda',
    },
  ] as const;

  const accionesAdmin = [
    {
      clave: 'profesionales.ver',
      nombre: 'Ver profesionales',
      descripcion: 'Permite ver la lista de profesionales',
    },
    {
      clave: 'profesionales.crear',
      nombre: 'Crear profesionales',
      descripcion: 'Permite crear nuevos profesionales',
    },
    {
      clave: 'profesionales.editar',
      nombre: 'Editar profesionales',
      descripcion: 'Permite editar profesionales existentes',
    },
    {
      clave: 'profesionales.eliminar',
      nombre: 'Eliminar profesionales',
      descripcion: 'Permite eliminar profesionales',
    },
    {
      clave: 'usuarios.ver',
      nombre: 'Ver usuarios',
      descripcion: 'Permite ver la lista de usuarios',
    },
    {
      clave: 'permisos.gestionar',
      nombre: 'Gestionar permisos',
      descripcion: 'Permite gestionar permisos y grupos',
    },
  ] as const;

  const admins = [
    {
      email: 'admin@nutrifit.com',
      nombre: 'Agustin',
      apellido: 'Suarez',
      fechaNacimiento: '1988-03-10',
      genero: 'MASCULINO',
      telefono: '3417011001',
      direccion: 'San Martin 1234',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      dni: '27111222',
    },
    {
      email: 'admin2@nutrifit.com',
      nombre: 'Paula',
      apellido: 'Roldan',
      fechaNacimiento: '1990-07-22',
      genero: 'FEMENINO',
      telefono: '3417011002',
      direccion: 'Cordoba 845',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      dni: '28122333',
    },
    {
      email: 'admin3@nutrifit.com',
      nombre: 'Diego',
      apellido: 'Morales',
      fechaNacimiento: '1986-11-03',
      genero: 'MASCULINO',
      telefono: '3417011003',
      direccion: 'Mendoza 2200',
      ciudad: 'Funes',
      provincia: 'Santa Fe',
      dni: '26133444',
    },
  ] as const;

  const nutricionistas = [
    {
      email: 'nutri@nutrifit.com',
      nombre: 'Lucia',
      apellido: 'Bianchi',
      fechaNacimiento: '1990-01-01',
      genero: 'FEMENINO',
      dni: '30111222',
      matricula: 'MN-1201',
      telefono: '3415011001',
      direccion: 'Mitre 1450',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      aniosExperiencia: 6,
      tarifaSesion: 15000,
      fotoPerfilKey: 'defaults/nutricionista-lucia.png',
    },
    {
      email: 'nutri2@nutrifit.com',
      nombre: 'Martin',
      apellido: 'Lopez',
      fechaNacimiento: '1987-05-14',
      genero: 'MASCULINO',
      dni: '30222333',
      matricula: 'MN-1202',
      telefono: '3415011002',
      direccion: 'Italia 530',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      aniosExperiencia: 9,
      tarifaSesion: 17000,
      fotoPerfilKey: 'defaults/nutricionista-martin.png',
    },
    {
      email: 'nutri3@nutrifit.com',
      nombre: 'Carla',
      apellido: 'Mendez',
      fechaNacimiento: '1992-09-02',
      genero: 'FEMENINO',
      dni: '30333444',
      matricula: 'MN-1203',
      telefono: '3415011003',
      direccion: 'Belgrano 901',
      ciudad: 'Funes',
      provincia: 'Santa Fe',
      aniosExperiencia: 5,
      tarifaSesion: 14500,
      fotoPerfilKey: 'defaults/nutricionista-carla.png',
    },
  ] as const;

  const socios = [
    {
      email: 'socio@nutrifit.com',
      nombre: 'Juan',
      apellido: 'Perez',
      fechaNacimiento: '1995-01-01',
      genero: 'MASCULINO',
      dni: '40111222',
      telefono: '3416011001',
      direccion: 'Oroño 455',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      fechaAlta: '2025-01-10',
      fotoPerfilKey: 'defaults/socio-juan.png',
    },
    {
      email: 'socio2@nutrifit.com',
      nombre: 'Maria',
      apellido: 'Gomez',
      fechaNacimiento: '1998-04-18',
      genero: 'FEMENINO',
      dni: '40222333',
      telefono: '3416011002',
      direccion: 'Paraguay 1320',
      ciudad: 'Rosario',
      provincia: 'Santa Fe',
      fechaAlta: '2025-02-03',
      fotoPerfilKey: 'defaults/socio-maria.png',
    },
    {
      email: 'socio3@nutrifit.com',
      nombre: 'Diego',
      apellido: 'Ramirez',
      fechaNacimiento: '1993-12-07',
      genero: 'MASCULINO',
      dni: '40333444',
      telefono: '3416011003',
      direccion: 'Juan B Justo 755',
      ciudad: 'Villa Gobernador Galvez',
      provincia: 'Santa Fe',
      fechaAlta: '2025-02-20',
      fotoPerfilKey: 'defaults/socio-diego.png',
    },
  ] as const;

  const vincularUsuarioAGrupo = async (
    idUsuario: number,
    claveGrupo: 'ADMIN' | 'PROFESIONAL',
  ) => {
    await dataSource.query(
      `INSERT IGNORE INTO usuario_grupo_permiso (id_usuario, id_grupo_permiso)
       SELECT ?, gp.id_grupo_permiso
       FROM grupo_permiso gp
       WHERE gp.clave = ?`,
      [idUsuario, claveGrupo],
    );
  };

  try {
    await dataSource.initialize();

    console.log('📝 Verificando grupos de permisos...');

    // Inicializar cliente MinIO
    const minioClient = new Minio.Client({
      endPoint: process.env.MINIO_ENDPOINT || 'localhost',
      port: Number(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
      secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    });

    const bucketName = process.env.MINIO_BUCKET_NAME || 'nutrifit-fotos-perfil';

    // Asegurar que el bucket existe
    const bucketExiste = await minioClient.bucketExists(bucketName);
    if (!bucketExiste) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`📦 Bucket '${bucketName}' creado`);
    }

    console.log('📷 Subiendo imágenes de perfil por defecto...');

    await dataSource.query(
      `INSERT INTO grupo_permiso (clave, nombre, descripcion)
       SELECT 'PROFESIONAL', 'Profesional', 'Grupo de permisos para nutricionistas'
       WHERE NOT EXISTS (SELECT 1 FROM grupo_permiso WHERE clave = 'PROFESIONAL')`,
    );

    await dataSource.query(
      `INSERT INTO grupo_permiso (clave, nombre, descripcion)
       SELECT 'ADMIN', 'Administrador', 'Grupo de permisos para administradores'
       WHERE NOT EXISTS (SELECT 1 FROM grupo_permiso WHERE clave = 'ADMIN')`,
    );

    console.log('📝 Verificando acciones de permisos...');

    for (const accion of [...accionesProfesional, ...accionesAdmin]) {
      await dataSource.query(
        `INSERT INTO accion (clave, nombre, descripcion)
         SELECT ?, ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM accion WHERE clave = ?)`,
        [accion.clave, accion.nombre, accion.descripcion, accion.clave],
      );
    }

    console.log('📝 Vinculando acciones con grupos...');

    for (const accion of accionesProfesional) {
      await dataSource.query(
        `INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
         SELECT gp.id_grupo_permiso, a.id_accion
         FROM grupo_permiso gp
         INNER JOIN accion a ON a.clave = ?
         WHERE gp.clave = 'PROFESIONAL'`,
        [accion.clave],
      );
    }

    for (const accion of accionesAdmin) {
      await dataSource.query(
        `INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
         SELECT gp.id_grupo_permiso, a.id_accion
         FROM grupo_permiso gp
         INNER JOIN accion a ON a.clave = ?
         WHERE gp.clave = 'ADMIN'`,
        [accion.clave],
      );
    }

    console.log('📝 Creando usuarios de desarrollo...');

    const contraseniaHash = await bcrypt.hash('123456', 10);
    let adminsCreados = 0;
    let adminsActualizados = 0;
    let nutricionistasCreados = 0;
    let nutricionistasActualizados = 0;
    let sociosCreados = 0;
    let sociosActualizados = 0;

    for (const admin of admins) {
      const resultadoAdminExistente: unknown = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [admin.email],
      );

      const adminExistente = obtenerUsuarioExistente(resultadoAdminExistente);
      let idUsuario = adminExistente?.idUsuario ?? null;
      let idPersona = adminExistente?.idPersona ?? null;

      if (idPersona) {
        await dataSource.query(
          `UPDATE persona
           SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
               telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?,
               fecha_alta = NULL, matricula = NULL, anios_experiencia = NULL,
               tarifa_sesion = NULL, fecha_baja = NULL, tipo_persona = 'AsistenteOrmEntity'
           WHERE id_persona = ?`,
          [
            admin.nombre,
            admin.apellido,
            admin.fechaNacimiento,
            admin.genero,
            admin.telefono,
            admin.direccion,
            admin.ciudad,
            admin.provincia,
            admin.dni,
            idPersona,
          ],
        );
        adminsActualizados += 1;
      } else {
        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (
            nombre, apellido, fecha_nacimiento, genero, telefono, direccion,
            ciudad, provincia, dni, tipo_persona
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'AsistenteOrmEntity')`,
          [
            admin.nombre,
            admin.apellido,
            admin.fechaNacimiento,
            admin.genero,
            admin.telefono,
            admin.direccion,
            admin.ciudad,
            admin.provincia,
            admin.dni,
          ],
        );

        const idPersonaInsertada = obtenerInsertId(resultadoPersona);

        if (!idPersonaInsertada) {
          continue;
        }

        idPersona = idPersonaInsertada;

        if (idUsuario) {
          await dataSource.query(
            `UPDATE usuario
             SET id_persona = ?, rol = 'ADMIN'
             WHERE id_usuario = ?`,
            [idPersonaInsertada, idUsuario],
          );
          adminsActualizados += 1;
        } else {
          const resultadoUsuario: unknown = await dataSource.query(
            `INSERT INTO usuario (email, contrasenia, rol, id_persona)
             VALUES (?, ?, 'ADMIN', ?)`,
            [admin.email, contraseniaHash, idPersonaInsertada],
          );

          idUsuario = obtenerInsertId(resultadoUsuario);

          if (!idUsuario) {
            continue;
          }

          adminsCreados += 1;
        }
      }

      if (!idUsuario) {
        continue;
      }

      await dataSource.query(
        `UPDATE usuario
         SET rol = 'ADMIN'
         WHERE id_usuario = ?`,
        [idUsuario],
      );
      await vincularUsuarioAGrupo(idUsuario, 'ADMIN');
    }

    for (const nutricionista of nutricionistas) {
      const resultadoNutricionistaExistente: unknown = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [nutricionista.email],
      );

      const nutricionistaExistente = obtenerUsuarioExistente(
        resultadoNutricionistaExistente,
      );
      let idUsuario = nutricionistaExistente?.idUsuario ?? null;
      let idPersona = nutricionistaExistente?.idPersona ?? null;

      if (idPersona) {
        await dataSource.query(
          `UPDATE persona
           SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
               telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?,
               matricula = ?, anios_experiencia = ?, tarifa_sesion = ?,
               foto_perfil_key = ?,
               fecha_baja = NULL, tipo_persona = 'NutricionistaOrmEntity'
           WHERE id_persona = ?`,
          [
            nutricionista.nombre,
            nutricionista.apellido,
            nutricionista.fechaNacimiento,
            nutricionista.genero,
            nutricionista.telefono,
            nutricionista.direccion,
            nutricionista.ciudad,
            nutricionista.provincia,
            nutricionista.dni,
            nutricionista.matricula,
            nutricionista.aniosExperiencia,
            nutricionista.tarifaSesion,
            nutricionista.fotoPerfilKey,
            idPersona,
          ],
        );
        nutricionistasActualizados += 1;
      } else {
        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (
            nombre, apellido, fecha_nacimiento, genero, telefono, direccion,
            ciudad, provincia, dni, matricula, anios_experiencia, tarifa_sesion,
            foto_perfil_key, fecha_baja, tipo_persona
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, 'NutricionistaOrmEntity')`,
          [
            nutricionista.nombre,
            nutricionista.apellido,
            nutricionista.fechaNacimiento,
            nutricionista.genero,
            nutricionista.telefono,
            nutricionista.direccion,
            nutricionista.ciudad,
            nutricionista.provincia,
            nutricionista.dni,
            nutricionista.matricula,
            nutricionista.aniosExperiencia,
            nutricionista.tarifaSesion,
            nutricionista.fotoPerfilKey,
          ],
        );

        const idPersonaInsertada = obtenerInsertId(resultadoPersona);

        if (!idPersonaInsertada) {
          continue;
        }

        idPersona = idPersonaInsertada;

        if (idUsuario) {
          await dataSource.query(
            `UPDATE usuario
             SET id_persona = ?, rol = 'NUTRICIONISTA'
             WHERE id_usuario = ?`,
            [idPersonaInsertada, idUsuario],
          );
          nutricionistasActualizados += 1;
        } else {
          const resultadoUsuario: unknown = await dataSource.query(
            `INSERT INTO usuario (email, contrasenia, rol, id_persona)
             VALUES (?, ?, 'NUTRICIONISTA', ?)`,
            [nutricionista.email, contraseniaHash, idPersonaInsertada],
          );

          idUsuario = obtenerInsertId(resultadoUsuario);

          if (!idUsuario) {
            continue;
          }

          nutricionistasCreados += 1;
        }
      }

      if (!idUsuario) {
        continue;
      }

      await dataSource.query(
        `UPDATE usuario
         SET rol = 'NUTRICIONISTA'
         WHERE id_usuario = ?`,
        [idUsuario],
      );
      await vincularUsuarioAGrupo(idUsuario, 'PROFESIONAL');

      // Subir imagen de perfil por defecto
      await subirImagenPorDefecto(
        minioClient,
        bucketName,
        nutricionista.fotoPerfilKey,
        nutricionista.nombre,
        nutricionista.apellido,
        nutricionista.genero,
      );
    }

    for (const socio of socios) {
      const resultadoSocioExistente: unknown = await dataSource.query(
        'SELECT id_usuario, id_persona FROM usuario WHERE email = ?',
        [socio.email],
      );

      const socioExistente = obtenerUsuarioExistente(resultadoSocioExistente);
      let idUsuario = socioExistente?.idUsuario ?? null;
      let idPersona = socioExistente?.idPersona ?? null;

      if (idPersona) {
        await dataSource.query(
          `UPDATE persona
           SET nombre = ?, apellido = ?, fecha_nacimiento = ?, genero = ?,
               telefono = ?, direccion = ?, ciudad = ?, provincia = ?, dni = ?,
               fecha_alta = ?, foto_perfil_key = ?, tipo_persona = 'SocioOrmEntity'
           WHERE id_persona = ?`,
          [
            socio.nombre,
            socio.apellido,
            socio.fechaNacimiento,
            socio.genero,
            socio.telefono,
            socio.direccion,
            socio.ciudad,
            socio.provincia,
            socio.dni,
            socio.fechaAlta,
            socio.fotoPerfilKey,
            idPersona,
          ],
        );
        sociosActualizados += 1;
      } else {
        const resultadoPersona: unknown = await dataSource.query(
          `INSERT INTO persona (
            nombre, apellido, fecha_nacimiento, genero, telefono, direccion,
            ciudad, provincia, dni, fecha_alta, foto_perfil_key, tipo_persona
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SocioOrmEntity')`,
          [
            socio.nombre,
            socio.apellido,
            socio.fechaNacimiento,
            socio.genero,
            socio.telefono,
            socio.direccion,
            socio.ciudad,
            socio.provincia,
            socio.dni,
            socio.fechaAlta,
            socio.fotoPerfilKey,
          ],
        );

        const idPersonaInsertada = obtenerInsertId(resultadoPersona);

        if (!idPersonaInsertada) {
          continue;
        }

        idPersona = idPersonaInsertada;

        if (idUsuario) {
          await dataSource.query(
            `UPDATE usuario
             SET id_persona = ?, rol = 'SOCIO'
             WHERE id_usuario = ?`,
            [idPersonaInsertada, idUsuario],
          );
          sociosActualizados += 1;
        } else {
          const resultadoUsuarioSocio: unknown = await dataSource.query(
            `INSERT INTO usuario (email, contrasenia, rol, id_persona)
             VALUES (?, ?, 'SOCIO', ?)`,
            [socio.email, contraseniaHash, idPersonaInsertada],
          );

          idUsuario = obtenerInsertId(resultadoUsuarioSocio);

          if (!idUsuario) {
            continue;
          }

          sociosCreados += 1;
        }
      }

      if (!idUsuario) {
        continue;
      }

      await dataSource.query(
        `UPDATE usuario
         SET rol = 'SOCIO'
         WHERE id_usuario = ?`,
        [idUsuario],
      );

      // Subir imagen de perfil por defecto
      await subirImagenPorDefecto(
        minioClient,
        bucketName,
        socio.fotoPerfilKey,
        socio.nombre,
        socio.apellido,
        socio.genero,
      );
    }

    console.log('✅ Seed completado exitosamente');
    console.log('');
    console.log('📊 Resumen:');
    console.log(`   - Acciones PROFESIONAL: ${accionesProfesional.length}`);
    console.log(`   - Acciones ADMIN: ${accionesAdmin.length}`);
    console.log(`   - Admins creados: ${adminsCreados}`);
    console.log(`   - Admins actualizados: ${adminsActualizados}`);
    console.log(`   - Nutricionistas creados: ${nutricionistasCreados}`);
    console.log(
      `   - Nutricionistas actualizados: ${nutricionistasActualizados}`,
    );
    console.log(`   - Socios creados: ${sociosCreados}`);
    console.log(`   - Socios actualizados: ${sociosActualizados}`);
  } catch (error) {
    console.error('❌ Error al ejecutar el seed:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

void runSeed();
