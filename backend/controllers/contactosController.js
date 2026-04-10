const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Importamos la base de datos

// Función para registrar usuario (NUEVA VERSIÓN CON TELÉFONO)
const register = async (req, res) => {
  const { username, password, telefono } = req.body; 
  console.log('Datos recibidos para el registro:', { username, password, telefono });

  try {
    // Verificamos si el usuario o el teléfono ya existen en la base de datos
    const userResult = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR telefono = $2', 
      [username, telefono]
    );
    
    if (userResult.rows.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario o el teléfono ya están en uso' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insertamos el usuario incluyendo el teléfono
    await pool.query(
      'INSERT INTO users (username, password, telefono) VALUES ($1, $2, $3)', 
      [username, hashedPassword, telefono]
    );

    res.status(201).json({ mensaje: 'Usuario registrado exitosamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};

// Función para iniciar sesión (SE MANTIENE IGUAL)
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
    res.status(200).json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

module.exports = { register, login };