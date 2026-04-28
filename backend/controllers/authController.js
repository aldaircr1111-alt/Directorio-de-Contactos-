const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { username, password, telefono } = req.body;
        
        // Verificar si el usuario ya existe
        const userExists = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Guardar el nuevo usuario en la base de datos
        const result = await db.query(
            'INSERT INTO users (username, password, telefono) VALUES ($1, $2, $3) RETURNING id, username, telefono',
            [username, hashedPassword, telefono]
        );

        res.status(201).json({ 
            mensaje: 'Usuario registrado exitosamente', 
            user: result.rows[0] 
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno al registrar el usuario' });
    }
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar al usuario en la base de datos
        const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = result.rows[0];

        // Comparar contraseñas
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // Generar Token JWT asegurando que el ID va por dentro
        const token = jwt.sign(
            { id: user.id, username: user.username, telefono: user.telefono },
            process.env.JWT_SECRET || 'secreta',
            { expiresIn: '24h' }
        );

        res.json({
            mensaje: 'Login exitoso',
            token,
            user: { id: user.id, username: user.username, telefono: user.telefono }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno al iniciar sesión' });
    }
};