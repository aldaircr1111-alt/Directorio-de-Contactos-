const pool = require('../config/db');

// Obtener todos los contactos del usuario
const obtenerContactos = async (req, res) => {
  try {
    // req.user.id viene del middleware verificarToken
    const result = await pool.query('SELECT * FROM contactos WHERE user_id = $1', [req.user.id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener contactos:', error);
    res.status(500).json({ error: 'Error al obtener los contactos' });
  }
};

// Crear un nuevo contacto
const guardarContacto = async (req, res) => {
  const { nombre, telefono, categoria } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contactos (nombre, telefono, categoria, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, telefono, categoria, req.user.id]
    );
    res.status(201).json({ contacto: result.rows[0] });
  } catch (error) {
    console.error('Error al guardar contacto:', error);
    res.status(500).json({ error: 'Error al guardar el contacto' });
  }
};

// Editar un contacto existente
const editarContacto = async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, categoria } = req.body;
  try {
    const result = await pool.query(
      'UPDATE contactos SET nombre = $1, telefono = $2, categoria = $3 WHERE id = $4 AND user_id = $5 RETURNING *',
      [nombre, telefono, categoria, id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no autorizado' });
    }
    
    res.status(200).json({ contacto: result.rows[0] });
  } catch (error) {
    console.error('Error al editar contacto:', error);
    res.status(500).json({ error: 'Error al editar el contacto' });
  }
};

// Eliminar un contacto
const eliminarContacto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM contactos WHERE id = $1 AND user_id = $2 RETURNING *', [id, req.user.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Contacto no encontrado o no autorizado' });
    }

    res.status(200).json({ mensaje: 'Contacto eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar contacto:', error);
    res.status(500).json({ error: 'Error al eliminar el contacto' });
  }
};

module.exports = { obtenerContactos, guardarContacto, editarContacto, eliminarContacto };