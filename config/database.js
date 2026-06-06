const mysql2 = require('mysql2');

const pool = mysql2.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'abhyaas_db',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
