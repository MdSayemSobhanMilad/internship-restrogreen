import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  port: 3307,
  database: 'restrogreen',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;