const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Buscamos el token en la cabecera
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No se proporcionó un token' });
    }

    // Verificamos si el token es real
    jwt.verify(token, process.env.JWT_SECRET || 'secreta', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado' });
        }
        
        // AQUÍ ESTÁ EL TRUCO: Guardamos los datos del usuario en 'req.user'
        // para que el controlador pueda usarlos después.
        req.user = decoded; 
        next();
    });
};