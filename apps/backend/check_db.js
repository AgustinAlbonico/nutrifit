const mysql = require('mysql2');
const conn = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'root',
  database: 'nutrifit_supervisor'
});
conn.connect(function(err) {
  if (err) {
    console.log('CONNECT ERROR: ' + err.message);
    conn.end();
    return;
  }
  conn.query('SELECT email, rol FROM usuario WHERE email LIKE "%@nutrifit.com" LIMIT 10', function(err, rows) {
    if (err) {
      console.log('QUERY ERROR: ' + err.message);
    } else {
      console.log('USERS FOUND: ' + JSON.stringify(rows, null, 2));
    }
    conn.end();
  });
});