const db = require('../config/db');

exports.obtenerMensajes = async (req, res) => {
    try {
        const mi_id = req.user.id; // Tu ID interno
        const contacto_telefono = req.params.contactoId; // El teléfono que llega del Frontend

        // 1. Buscamos a quién le pertenece ese teléfono
        const userResult = await db.query('SELECT id FROM users WHERE telefono = $1', [contacto_telefono]);
        
        // Si no existe, es porque no usan la app, devolvemos un chat vacío
        if (userResult.rows.length === 0) {
            return res.json([]); 
        }
        
        const contacto_id = userResult.rows[0].id;

        // 2. Traemos los mensajes cruzando los datos para incluir los teléfonos en la respuesta
        const query = `
            SELECT 
                m.*, 
                u1.telefono AS remitente_telefono, 
                u2.telefono AS receptor_telefono
            FROM mensajes m
            JOIN users u1 ON m.remitente_id = u1.id
            JOIN users u2 ON m.receptor_id = u2.id
            WHERE (m.remitente_id = $1 AND m.receptor_id = $2) 
               OR (m.remitente_id = $2 AND m.receptor_id = $1)
            ORDER BY m.fecha_envio ASC
        `;
        const result = await db.query(query, [mi_id, contacto_id]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error al obtener el historial' });
    }
};

exports.guardarMensaje = async (req, res) => {
    try {
        const mi_id = req.user.id; 
        const { receptor_telefono, contenido } = req.body; 

        // 1. Buscamos el ID del receptor usando el teléfono al que le escribiste
        const userResult = await db.query('SELECT id FROM users WHERE telefono = $1', [receptor_telefono]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'El contacto no usa la app' });
        }

        const receptor_id = userResult.rows[0].id;

        // 2. Guardamos el mensaje en la base de datos
        const query = `
            INSERT INTO mensajes (remitente_id, receptor_id, contenido) 
            VALUES ($1, $2, $3) RETURNING *
        `;
        const result = await db.query(query, [mi_id, receptor_id, contenido]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al guardar mensaje:', error);
        res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
};