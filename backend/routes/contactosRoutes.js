const express = require('express');
const router = express.Router();
const verificarToken = require('../middlewares/authMiddleware');
const { obtenerContactos, guardarContacto, eliminarContacto, editarContacto } = require('../controllers/contactosController');

// Todas estas rutas pasarán primero por verificarToken
router.get('/', verificarToken, obtenerContactos);
router.post('/', verificarToken, guardarContacto);
router.delete('/:id', verificarToken, eliminarContacto);
router.put('/:id', verificarToken, editarContacto);

module.exports = router;