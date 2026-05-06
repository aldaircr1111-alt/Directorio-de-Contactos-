const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middlewares/authMiddleware'); // El portero de seguridad

// Ruta para obtener el historial con un contacto (ej. GET /chat/3)
router.get('/:contactoId', authMiddleware, chatController.obtenerMensajes);

// Ruta para guardar un nuevo mensaje (POST /chat)
router.post('/', authMiddleware, chatController.guardarMensaje);

module.exports = router;