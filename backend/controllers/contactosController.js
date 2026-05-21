const db = require('../config/db');

exports.guardarContacto = async (req, res) => {
    try {
        // CORRECCIÓN: Agregamos 'edad' para que lo reciba del Frontend
        const { nombre, telefono, categoria, edad } = req.body;
        
        // Verificamos si el usuario existe antes de leer su ID
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Usuario no identificado' });
        }

        const user_id = req.user.id; // El ID viene del token JWT

        // CORRECCIÓN: Agregamos 'edad' a la consulta SQL ($4) y recorremos el user_id al $5
        const query = 'INSERT INTO contactos (nombre, telefono, categoria, edad, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *';
        const values = [nombre, telefono, categoria, edad, user_id];
        
        const result = await db.query(query, values);
        
        res.status(201).json({
            mensaje: '¡Contacto guardado con éxito!',
            contacto: result.rows[0]
        });
    } catch (error) {
        console.error('Error al guardar contacto:', error);
        res.status(500).json({ error: 'Error interno al guardar en la base de datos' });
    }
};

exports.obtenerContactos = async (req, res) => {
    try {
        const user_id = req.user.id;
        const result = await db.query('SELECT * FROM contactos WHERE user_id = $1', [user_id]);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener contactos' });
    }
};

exports.eliminarContacto = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        await db.query('DELETE FROM contactos WHERE id = $1 AND user_id = $2', [id, user_id]);
        res.json({ mensaje: 'Contacto eliminado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar contacto' });
    }
};

exports.actualizarContacto = async (req, res) => {
    try {
        const { id } = req.params;
        // CORRECCIÓN CRÍTICA: Faltaba extraer 'edad' aquí, lo que rompía el servidor en la siguiente línea
        const { nombre, telefono, categoria, edad } = req.body; 
        const user_id = req.user.id;
        
        const query = 'UPDATE contactos SET nombre = $1, telefono = $2, categoria = $3, edad = $4 WHERE id = $5 AND user_id = $6 RETURNING *';
        const result = await db.query(query, [nombre, telefono, categoria, edad, id, user_id]);
        
        res.json({ mensaje: 'Contacto actualizado', contacto: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar contacto:', error);
        res.status(500).json({ error: 'Error al actualizar contacto' });
    }
};