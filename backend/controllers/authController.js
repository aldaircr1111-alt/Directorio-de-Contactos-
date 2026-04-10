const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Importamos la base de datos

// Función para registrar usuario
const register = async (req, res) => {
  const { username, password } = req.body;
  console.log('Datos recibidos para el registro:', { username, password });

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length > 0) {
      return res.status(400).send('El nombre de usuario ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hashedPassword]);

    res.status(201).send('Usuario registrado');
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).send('Error al registrar el usuario');
  }
};

const login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id }, 'secreta', { expiresIn: '1h' });
    
    // ENVIAMOS TAMBIÉN LOS DATOS DEL USUARIO (sin la contraseña por seguridad)
    res.status(200).json({ 
      token, 
      user: { 
        username: user.username, 
        telefono: user.telefono 
      } 
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).send('Error al iniciar sesión');
  }
};

module.exports = { register, login };