const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'nutrifit_supervisor',
  multipleStatements: true
});

const tables = `
CREATE TABLE IF NOT EXISTS persona (
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
  fecha_baja DATETIME NULL,
  PRIMARY KEY (id_persona)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ficha_salud (
  id_ficha_salud INT NOT NULL AUTO_INCREMENT,
  altura INT NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  objetivo_personal VARCHAR(255) NULL,
  nivel_actividad_fisica ENUM('Sedentario', 'Moderado', 'Intenso') NOT NULL,
  PRIMARY KEY (id_ficha_salud)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario (
  id_usuario INT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  contrasenia VARCHAR(255) NOT NULL,
  fecha_hora_alta DATETIME NOT NULL,
  rol ENUM('ADMIN', 'NUTRICIONISTA', 'SOCIO') NOT NULL,
  id_persona INT NULL,
  PRIMARY KEY (id_usuario),
  UNIQUE INDEX email_idx (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grupo_permiso (
  id_grupo_permiso INT NOT NULL AUTO_INCREMENT,
  clave VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_grupo_permiso)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS accion (
  id_accion INT NOT NULL AUTO_INCREMENT,
  clave VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  descripcion VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_accion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grupo_permiso_accion (
  id_grupo_permiso INT NOT NULL,
  id_accion INT NOT NULL,
  PRIMARY KEY (id_grupo_permiso, id_accion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario_grupo_permiso (
  id_usuario INT NOT NULL,
  id_grupo_permiso INT NOT NULL,
  PRIMARY KEY (id_usuario, id_grupo_permiso)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS plan_alimentacion (
  id_plan_alimentacion INT NOT NULL AUTO_INCREMENT,
  fechaCreacion DATE NOT NULL,
  objetivo_nutricional VARCHAR(255) NOT NULL,
  id_socio INT NOT NULL,
  id_nutricionista INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  eliminado_en DATETIME NULL,
  motivo_eliminacion VARCHAR(255) NULL,
  motivo_edicion VARCHAR(255) NULL,
  ultima_edicion DATETIME NULL,
  PRIMARY KEY (id_plan_alimentacion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS dia_plan (
  id_dia_plan INT NOT NULL AUTO_INCREMENT,
  dia ENUM('LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO') NOT NULL,
  orden INT NOT NULL,
  id_plan_alimentacion INT NOT NULL,
  PRIMARY KEY (id_dia_plan)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opcion_comida (
  id_opcion_comida INT NOT NULL AUTO_INCREMENT,
  comentarios VARCHAR(255) NULL,
  tipo_comida ENUM('DESAYUNO', 'ALMUERZO', 'MERIENDA', 'CENA', 'COLACION') NOT NULL,
  id_dia_plan INT NULL,
  PRIMARY KEY (id_opcion_comida)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alimento (
  id_alimento INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL,
  calorias INT NULL,
  proteinas INT NULL,
  carbohidratos INT NULL,
  grasas INT NULL,
  hidratos_de_carbono INT NULL,
  unidad_medida ENUM('gramo', 'kilogramo', 'mililitro', 'litro', 'miligramo', 'taza', 'cucharada', 'cucharadita') NOT NULL,
  PRIMARY KEY (id_alimento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS grupo_alimenticio (
  id_grupo_alimenticio INT NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(255) NOT NULL,
  PRIMARY KEY (id_grupo_alimenticio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alimento_grupo_alimenticio (
  id_alimento INT NOT NULL,
  id_grupo_alimenticio INT NOT NULL,
  PRIMARY KEY (id_alimento, id_grupo_alimenticio)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS opcion_comida_alimento (
  id_opcion_comida INT NOT NULL,
  id_alimento INT NOT NULL,
  PRIMARY KEY (id_opcion_comida, id_alimento)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS agenda (
  id_agenda INT NOT NULL AUTO_INCREMENT,
  dia ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo') NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_turno INT NOT NULL,
  id_nutricionista INT NOT NULL,
  PRIMARY KEY (id_agenda)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS turno (
  id_turno INT NOT NULL AUTO_INCREMENT,
  fecha DATE NOT NULL,
  hora_turno VARCHAR(10) NOT NULL,
  estado ENUM('PENDIENTE', 'CONFIRMADO', 'CANCELADO', 'REALIZADO', 'AUSENTE', 'REPROGRAMADO') NOT NULL,
  id_observacion INT NULL,
  id_socio INT NOT NULL,
  id_nutricionista INT NOT NULL,
  PRIMARY KEY (id_turno)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS observacion_clinica (
  id_observacion INT NOT NULL AUTO_INCREMENT,
  comentario VARCHAR(255) NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  altura INT NOT NULL,
  imc DECIMAL(5,2) NOT NULL,
  sugerencias VARCHAR(255) NULL,
  habitos_socio VARCHAR(255) NULL,
  objetivos_socio VARCHAR(255) NULL,
  PRIMARY KEY (id_observacion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS patologia (
  id_patologia INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_patologia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alergia (
  id_alergia INT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  PRIMARY KEY (id_alergia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ficha_salud_patologias (
  id_ficha_salud INT NOT NULL,
  id_patologia INT NOT NULL,
  PRIMARY KEY (id_ficha_salud, id_patologia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ficha_salud_alergias (
  id_ficha_salud INT NOT NULL,
  id_alergia INT NOT NULL,
  PRIMARY KEY (id_ficha_salud, id_alergia)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medicion (
  id_medicion INT NOT NULL AUTO_INCREMENT,
  fecha DATETIME NOT NULL,
  peso DECIMAL(5,2) NOT NULL,
  altura INT NOT NULL,
  imc DECIMAL(5,2) NOT NULL,
  porcentaje_grasa DECIMAL(5,2) NULL,
  porcentaje_musculo DECIMAL(5,2) NULL,
  circunferencia_cintura DECIMAL(5,2) NULL,
  circunferencia_cadera DECIMAL(5,2) NULL,
  circunferencia_brazo DECIMAL(5,2) NULL,
  notas VARCHAR(255) NULL,
  id_socio INT NOT NULL,
  PRIMARY KEY (id_medicion)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS formacion_academica (
  id_formacion_academica INT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(255) NOT NULL,
  institucion VARCHAR(255) NOT NULL,
  anio_inicio INT NOT NULL,
  anio_fin INT NOT NULL,
  nivel VARCHAR(50) NOT NULL,
  id_nutricionista INT NOT NULL,
  PRIMARY KEY (id_formacion_academica)
) ENGINE=InnoDB;
`;

conn.query(tables, (err) => {
  if (err) {
    console.error('Error:', err.message);
    conn.end();
    process.exit(1);
  }
  console.log('All tables created successfully');
  conn.end();
  process.exit(0);
});
