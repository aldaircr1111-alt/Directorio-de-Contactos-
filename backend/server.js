const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg'); // Importar el cliente de PostgreSQL

const app = express();
const cors = require('cors');
app.use(cors());
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

// === RUTAS DE AUTENTICACIÓN ===

// Ruta para registrar un nuevo usuario
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log('Datos recibidos para el registro:', { username, password });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('Resultado de la consulta para verificar usuario:', userResult.rows);

    if (userResult.rows.length > 0) {
      return res.status(400).send('El nombre de usuario ya está en uso');
    }

    // Encriptar la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Contraseña encriptada:', hashedPassword);

    // Insertar el nuevo usuario en la base de datos
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

    res.status(201).send('Usuario registrado');
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).send('Error al registrar el usuario');
  }
});

// Ruta para iniciar sesión
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Datos recibidos para login:', { username, password });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    console.log('Resultado de la consulta para login:', userResult.rows);

    if (userResult.rows.length === 0) {
      return res.status(400).send('Usuario no encontrado');
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Contraseña coincidente:', isMatch);

    if (!isMatch) {
      return res.status(400).send('Contraseña incorrecta');
    }

    // CORRECCIÓN CLAVE: Guardamos el user.id en lugar del username para enlazar los contactos
    const token = jwt.sign({ id: user.id }, 'secreta', { expiresIn: '1h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send('Error al iniciar sesión');
  }
});


// === EL PORTERO DE SEGURIDAD (Middleware) ===
const verificarToken = (req, res, next) => {
  // Extraemos el token. Puede venir como "Bearer eyJhb..." o solo "eyJhb..."
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || authHeader;

  if (!token) return res.status(403).json({ error: 'Acceso denegado. No hay token.' });

  // Verificamos usando la misma palabra 'secreta' del login
  jwt.verify(token, 'secreta', (err, decodificado) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });
    
    // Guardamos el ID del usuario extraído del token
    req.usuarioId = decodificado.id; 
    next(); 
  });
};


// === RUTAS PROTEGIDAS PARA LOS CONTACTOS ===

// Ruta 1: Guardar un nuevo contacto (POST)
app.post('/contactos', verificarToken, async (req, res) => {
  const { nombre, telefono, categoria } = req.body;
  
  try {
    // Insertamos el contacto usando el ID del usuario autenticado (req.usuarioId)
    const nuevoContacto = await pool.query(
      'INSERT INTO contactos (usuario_id, nombre, telefono, categoria) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.usuarioId, nombre, telefono, categoria]
    );
    res.status(201).json({ mensaje: 'Contacto guardado con éxito', contacto: nuevoContacto.rows[0] });
  } catch (error) {
    console.error('Error al guardar el contacto:', error);
    res.status(500).json({ error: 'Hubo un problema al guardar el contacto' });
  }
});

// Ruta 2: Obtener los contactos del usuario (GET)
app.get('/contactos', verificarToken, async (req, res) => {
  try {
    // Buscamos SOLO los contactos que le pertenecen a este usuario_id
    const misContactos = await pool.query(
      'SELECT * FROM contactos WHERE usuario_id = $1',
      [req.usuarioId]
    );
    res.json(misContactos.rows);
  } catch (error) {
    console.error('Error al obtener los contactos:', error);
    res.status(500).json({ error: 'Hubo un problema al buscar los contactos' });
  }
});
// Ruta 3: Eliminar un contacto (DELETE)
app.delete('/contactos/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Solo borra si el ID del contacto coincide Y si le pertenece al usuario que lo pide
    const resultado = await pool.query(
      'DELETE FROM contactos WHERE id = $1 AND usuario_id = $2 RETURNING *',
      [id, req.usuarioId]
    );
    
    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no tienes permiso para borrarlo' });
    }
    
    res.json({ mensaje: 'Contacto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar el contacto:', error);
    res.status(500).json({ error: 'Hubo un problema al eliminar el contacto' });
  }
});

// Ruta 4: Editar un contacto (PUT)
app.put('/contactos/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, categoria } = req.body;
  
  try {
    // Solo actualiza si es el dueño del contacto
    const resultado = await pool.query(
      'UPDATE contactos SET nombre = $1, telefono = $2, categoria = $3 WHERE id = $4 AND usuario_id = $5 RETURNING *',
      [nombre, telefono, categoria, id, req.usuarioId]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no tienes permiso para editarlo' });
    }

    res.json({ mensaje: 'Contacto actualizado con éxito', contacto: resultado.rows[0] });
  } catch (error) {
    console.error('Error al actualizar el contacto:', error);
    res.status(500).json({ error: 'Hubo un problema al actualizar el contacto' });
  }
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo correctamente en http://localhost:${port}`);
});