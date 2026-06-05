const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'nutrifit_supervisor',
  multipleStatements: true,
});

const SQL = `
INSERT IGNORE INTO accion (clave, nombre, descripcion) VALUES
  ('permisos.leer',     'Permisos leer',     'Accion permisos.leer'),
  ('permisos.escribir', 'Permisos escribir', 'Accion permisos.escribir'),
  ('permisos.asignar',  'Permisos asignar',  'Accion permisos.asignar'),
  ('turnos.eliminar',   'Turnos eliminar',   'Accion turnos.eliminar');

INSERT IGNORE INTO grupo_permiso_accion (id_grupo_permiso, id_accion)
SELECT 1, a.id_accion
FROM accion a
WHERE a.clave IN ('permisos.leer', 'permisos.escribir', 'permisos.asignar', 'turnos.eliminar');

SELECT '=== Verificacion: acciones del grupo ADMIN ===' AS info;
SELECT COUNT(*) AS total_acciones_grupo_admin
FROM grupo_permiso_accion gpa
INNER JOIN grupo_permiso gp ON gpa.id_grupo_permiso = gp.id_grupo_permiso
WHERE gp.clave = 'ADMIN';

SELECT '=== Verificacion: 4 acciones nuevas en grupo ADMIN ===' AS info;
SELECT a.clave FROM grupo_permiso_accion gpa
INNER JOIN grupo_permiso gp ON gpa.id_grupo_permiso = gp.id_grupo_permiso
INNER JOIN accion a ON gpa.id_accion = a.id_accion
WHERE gp.clave = 'ADMIN'
  AND a.clave IN ('permisos.leer', 'permisos.escribir', 'permisos.asignar', 'turnos.eliminar')
ORDER BY a.clave;
`;

conn.connect(function(err) {
  if (err) {
    console.log('CONNECT ERROR: ' + err.message);
    conn.end();
    return;
  }
  conn.query(SQL, function(err, rows) {
    if (err) {
      console.log('QUERY ERROR: ' + err.message);
    } else {
      for (const r of rows) {
        console.log(JSON.stringify(r, null, 2));
      }
    }
    conn.end();
  });
});
