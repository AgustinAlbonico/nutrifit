const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'nutrifit_supervisor',
  multipleStatements: true,
});
conn.connect(function(err) {
  if (err) {
    console.log('CONNECT ERROR: ' + err.message);
    conn.end();
    return;
  }
  conn.query(`
    SELECT '=== ACCIONES EN DB ===' AS info;
    SELECT COUNT(*) AS total FROM accion;
    SELECT clave FROM accion ORDER BY clave;

    SELECT '=== GRUPO ADMIN ===' AS info;
    SELECT gp.id_grupo_permiso, gp.clave FROM grupo_permiso gp WHERE gp.clave = 'ADMIN';

    SELECT '=== ACCIONES DEL GRUPO ADMIN ===' AS info;
    SELECT a.clave FROM grupo_permiso gp
    INNER JOIN grupo_permiso_accion gpa ON gp.id_grupo_permiso = gpa.id_grupo_permiso
    INNER JOIN accion a ON gpa.id_accion = a.id_accion
    WHERE gp.clave = 'ADMIN'
    ORDER BY a.clave;

    SELECT '=== USUARIOS EN GRUPO ADMIN ===' AS info;
    SELECT u.email FROM usuario_grupo_permiso ugp
    INNER JOIN usuario u ON ugp.usuarioIdUsuario = u.id_usuario
    INNER JOIN grupo_permiso gp ON ugp.grupoPermisoId = gp.id_grupo_permiso
    WHERE gp.clave = 'ADMIN';
  `, function(err, rows) {
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
