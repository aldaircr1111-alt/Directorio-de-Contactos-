const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const port = 3000;

// Importar rutas modularizadas
const authRoutes = require('./routes/authRoutes');
const contactosRoutes = require('./routes/contactosRoutes');

// Usar las rutas
app.use('/', authRoutes);
app.use('/contactos', contactosRoutes); // Todo lo que empiece con /contactos se va a contactosRoutes

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo correctamente en http://localhost:${port}`);
});