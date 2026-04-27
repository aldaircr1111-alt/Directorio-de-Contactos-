const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de CORS para aceptar peticiones desde tu Frontend en Render
app.use(cors({
  origin: [
    'http://localhost:5173', // Permite pruebas locales
    'https://directorio-contactos-frontend.onrender.com' // Permite peticiones desde tu Frontend en la nube
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Usar el puerto que asigne Render, o el 3000 si estás local
const port = process.env.PORT || 3000;

// Importar rutas modularizadas
const authRoutes = require('./routes/authRoutes');
const contactosRoutes = require('./routes/contactosRoutes');

// Usar las rutas
app.use('/auth', authRoutes); // IMPORTANTE: Cambiado a /auth para que coincida con el Frontend
app.use('/contactos', contactosRoutes); 

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo correctamente en el puerto ${port}`);
});