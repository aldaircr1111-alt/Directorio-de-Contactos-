const db = require('../config/db');

// 1. Función para traer el historial de la conversación (como cuando abres un chat en WhatsApp)
exports.obtenerMensajes = async (req, res) => {
    try {
        const usuario_id = req.user.id; // Tu ID (el que inició sesión)
        const contacto_id = req.params.contactoId; // El ID de la persona con la que quieres chatear

        // Buscamos los mensajes donde tú enviaste y él recibió, O donde él envió y tú recibiste.
        // El 'ORDER BY fecha_envio ASC' asegura que los mensajes viejos salgan arriba y los nuevos abajo.
        const query = `
            SELECT * FROM mensajes 
            WHERE (remitente_id = $1 AND receptor_id = $2) 
               OR (remitente_id = $2 AND receptor_id = $1)
            ORDER BY fecha_envio ASC
        `;
        const result = await db.query(query, [usuario_id, contacto_id]);
        
        res.json(result.rows); // Le enviamos la lista de mensajes al Frontend
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error al obtener el historial de chat' });
    }
};

// 2. Función para guardar un mensaje nuevo en la base de datos
exports.guardarMensaje = async (req, res) => {
    try {
        const remitente_id = req.user.id; // Siempre eres tú el que envía
        const { receptor_id, contenido } = req.body; // A quién se lo envías y qué dice el texto

        const query = `
            INSERT INTO mensajes (remitente_id, receptor_id, contenido) 
            VALUES ($1, $2, $3) RETURNING *
        `;
        const result = await db.query(query, [remitente_id, receptor_id, contenido]);

        res.status(201).json(result.rows[0]); // Devolvemos el mensaje ya guardado
    } catch (error) {
        console.error('Error al guardar mensaje:', error);
        res.status(500).json({ error: 'Error al guardar el mensaje' });
    }
};