const pool = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Función para Registrar Usuario
const register = async (req, res) => {
  const { username, password, telefono } = req.body;

  try {
    // Hashear la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar en la base de datos (con el nuevo campo de teléfono)
    await pool.query(
      'INSERT INTO users (username, password, telefono) VALUES ($1, $2, $3)',
      [username, hashedPassword, telefono]
    );

    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error al registrar:', error);
    // Error 23505 es el código de PostgreSQL para "violación de regla UNIQUE"
    if (error.code === '23505') {
      return res.status(400).json({ error: 'El usuario o el teléfono ya están registrados' });
    }
    res.status(500).json({ error: 'Error interno del servidor al registrar' });
  }
};

// Función para Iniciar Sesión
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

    // Generar el token
    const token = jwt.sign({ id: user.id }, 'secreta', { expiresIn: '1h' });
    
    // AQUÍ ESTÁ LA CLAVE: Enviamos el token y los datos del usuario al frontend
    res.status(200).json({ 
      token, 
      user: { 
        username: user.username, 
        telefono: user.telefono 
      } 
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error interno del servidor al iniciar sesión' });
  }
};

module.exports = {
  register,
  login
};