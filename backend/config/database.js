const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'lampejo',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Testa conexão ao iniciar
pool.query('SELECT NOW()')
  .then(() => console.log('✅ PostgreSQL conectado'))
  .catch(err => console.error('❌ Erro PostgreSQL:', err.message));

module.exports = pool;
