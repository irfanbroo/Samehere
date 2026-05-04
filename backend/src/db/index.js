const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'samehere-pg',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'samehere',
  user: process.env.DB_USER || 'samehere',
  password: process.env.DB_PASSWORD || 'samehere123',
});

module.exports = pool;
