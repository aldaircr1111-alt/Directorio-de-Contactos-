const express = require('express');
const router = express.Router();
const contactosController = require('../controllers/contactosController');
const authMiddleware = require('../middlewares/authMiddleware');

// Proteger todas las rutas inyectando authMiddleware antes de llamar al controlador
router.get('/', authMiddleware, contactosController.obtenerContactos);
router.post('/', authMiddleware, contactosController.guardarContacto);
router.put('/:id', authMiddleware, contactosController.actualizarContacto);
router.delete('/:id', authMiddleware, contactosController.eliminarContacto);

module.exports = router;