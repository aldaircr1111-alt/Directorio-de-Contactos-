const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // Importar el cliente de PostgreSQL

const app = express();
const port = 3000;

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'directorio_contactos', // Nombre de la base de datos
  password: 'aldair1121', // La contraseña de tu base de datos PostgreSQL
  port: 5432,
});

app.use(express.json());

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Datos recibidos para el registro:', { username, password }); // Log de los datos recibidos

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    console.log('Resultado de la consulta para verificar usuario:', userResult.rows); // Log del resultado de la consulta

    if (userResult.rows.length > 0) {
      return res.status(400).send('El nombre de usuario ya está en uso');
    }

    // Encriptar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Contraseña encriptada:', hashedPassword); // Log de la contraseña encriptada

    // Insertar el nuevo usuario en la base de datos
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

    res.status(201).send('Usuario registrado');
  } catch (error) {
    console.error('Error al registrar el usuario:', error); // Log del error
    res.status(500).send('Error al registrar el usuario');
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Datos recibidos para login:', { username, password }); // Log de los datos recibidos

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    console.log('Resultado de la consulta para login:', userResult.rows); // Log del resultado de la consulta

    if (userResult.rows.length === 0) {
      return res.status(400).send('Usuario no encontrado');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    console.log('Contraseña coincidente:', isMatch); // Log de la comparación de contraseñas

    if (!isMatch) {
      return res.status(400).send('Contraseña incorrecta');
    }

    const token = jwt.sign({ id: user.username }, 'secreta', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error); // Log del error
    res.status(500).send('Error al iniciar sesión');
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo correctamente en http://localhost:${port}`);
});