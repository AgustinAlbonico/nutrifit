const mysql = require('mysql2/promise');

async function createTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'nutrifit_supervisor',
  });

  console.log('Connected to database');

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS foto_progreso (
        id_foto int NOT NULL AUTO_INCREMENT,
        id_socio int NOT NULL,
        tipo_foto enum ('frente', 'perfil', 'espalda', 'otro') NOT NULL,
        fecha datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        object_key varchar(255) NOT NULL,
        mime_type varchar(120) NOT NULL,
        notas text NULL,
        INDEX IDX_FOTO_PROGRESO_SOCIO (id_socio),
        PRIMARY KEY (id_foto)
      ) ENGINE=InnoDB
    `);
    console.log('Created foto_progreso table');

    await connection.query(`
      ALTER TABLE foto_progreso
      ADD CONSTRAINT FK_FOTO_PROGRESO_SOCIO
      FOREIGN KEY (id_socio) REFERENCES persona(id_persona)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    console.log('Added foreign key constraint to foto_progreso');
  } catch (err) {
    if (err.code === 'ER_MULTIPLE_PRI_KEY' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_FK_DUP_NAME') {
      console.log('foto_progreso table already exists or constraint already added');
    } else {
      console.error('Error with foto_progreso:', err.message);
    }
  }

  try {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS objetivo (
        id_objetivo int NOT NULL AUTO_INCREMENT,
        id_socio int NOT NULL,
        tipo_metrica enum ('PESO', 'CINTURA', 'CADERA', 'BRAZO', 'MUSLO', 'PECHO') NOT NULL,
        valor_inicial decimal(10,2) NOT NULL,
        valor_objetivo decimal(10,2) NOT NULL,
        valor_actual decimal(10,2) NOT NULL,
        estado enum ('ACTIVO', 'COMPLETADO', 'ABANDONADO') NOT NULL,
        fecha_inicio datetime NOT NULL,
        fecha_objetivo datetime NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_OBJETIVO_SOCIO (id_socio),
        PRIMARY KEY (id_objetivo)
      ) ENGINE=InnoDB
    `);
    console.log('Created objetivo table');

    await connection.query(`
      ALTER TABLE objetivo
      ADD CONSTRAINT FK_OBJETIVO_SOCIO
      FOREIGN KEY (id_socio) REFERENCES persona(id_persona)
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    console.log('Added foreign key constraint to objetivo');
  } catch (err) {
    if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_FK_DUP_NAME') {
      console.log('objetivo table already exists or constraint already added');
    } else {
      console.error('Error with objetivo:', err.message);
    }
  }

  await connection.end();
  console.log('Done!');
}

createTables().catch(console.error);
