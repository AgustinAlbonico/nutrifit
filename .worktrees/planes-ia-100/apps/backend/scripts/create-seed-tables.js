const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'nutrifit_supervisor',
  multipleStatements: true
});

const tables = [
  `CREATE TABLE IF NOT EXISTS persona (
    id_persona INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero ENUM('MASCULINO', 'FEMENINO', 'OTRO') NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    provincia VARCHAR(100) NOT NULL,
    fecha_alta DATE NULL,
    matricula VARCHAR(50) NULL,
    anios_experiencia INT NULL,
    tarifa_sesion DECIMAL(10,2) NULL,
    tipo_persona VARCHAR(255) NOT NULL,
    id_ficha_salud INT NULL,
    foto_perfil_key VARCHAR(255) NULL,
    PRIMARY KEY (id_persona)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS ficha_salud (
    id_ficha_salud INT NOT NULL AUTO_INCREMENT,
    altura INT NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    objetivo_personal VARCHAR(255) NULL,
    nivel_actividad_fisica ENUM('Sedentario', 'Moderado', 'Intenso') NOT NULL,
    PRIMARY KEY (id_ficha_salud)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INT NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    contrasenia VARCHAR(255) NOT NULL,
    fecha_hora_alta DATETIME NOT NULL,
    rol ENUM('ADMIN', 'NUTRICIONISTA', 'SOCIO') NOT NULL,
    id_persona INT NULL,
    PRIMARY KEY (id_usuario),
    UNIQUE INDEX email_idx (email)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS grupo_permiso (
    id_grupo_permiso INT NOT NULL AUTO_INCREMENT,
    clave VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_grupo_permiso)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS accion (
    id_accion INT NOT NULL AUTO_INCREMENT,
    clave VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_accion)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS grupo_permiso_accion (
    id_grupo_permiso INT NOT NULL,
    id_accion INT NOT NULL,
    PRIMARY KEY (id_grupo_permiso, id_accion)
  ) ENGINE=InnoDB`,

  `CREATE TABLE IF NOT EXISTS usuario_grupo_permiso (
    id_usuario INT NOT NULL,
    id_grupo_permiso INT NOT NULL,
    PRIMARY KEY (id_usuario, id_grupo_permiso)
  ) ENGINE=InnoDB`
];

let index = 0;
function createTable() {
  if (index >= tables.length) {
    console.log('All tables created');
    conn.end();
    return;
  }
  conn.query(tables[index], (err) => {
    if (err) console.error('Error creating table:', err.message);
    else console.log('Created table', index + 1);
    index++;
    createTable();
  });
}

createTable();
