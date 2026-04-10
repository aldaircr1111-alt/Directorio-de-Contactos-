const { Pool } = require('pg');

// Configuración de la conexión a la base de datos PostgreSQL en Neon
const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_GnmdY8yC9kfa@ep-round-hill-am14rzdj-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;