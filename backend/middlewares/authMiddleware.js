const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Buscar el token en los encabezados de la petición HTTP
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. No se proporcionó un token.' });
    }

    // Comprobar que el token es válido y no ha expirado
    jwt.verify(token, process.env.JWT_SECRET || 'secreta', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        
        // Asignar los datos del usuario decodificados (incluyendo el ID) a req.user
        req.user = decoded; 
        next(); // Continuar con la siguiente función
    });
};