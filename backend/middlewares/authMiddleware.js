const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1] || authHeader;

  if (!token) return res.status(403).json({ error: 'Acceso denegado. No hay token.' });

  jwt.verify(token, 'secreta', (err, decodificado) => {
    if (err) return res.status(401).json({ error: 'Token inválido o expirado' });
    req.usuarioId = decodificado.id; 
    next(); 
  });
};

module.exports = verificarToken;