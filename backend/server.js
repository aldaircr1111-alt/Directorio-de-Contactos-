const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Importamos el módulo HTTP nativo de Node
const { Server } = require('socket.io'); // 2. Importamos Socket.io

const app = express();

// 3. Envolvemos la app de Express en un servidor HTTP
const server = http.createServer(app);

// Extraemos la configuración de CORS a una variable para usarla en ambos lados (Express y Socket.io)
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    'https://directorio-contactos-frontend.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// 4. Inicializamos Socket.io pegado a nuestro nuevo servidor
const io = new Server(server, {
  cors: corsOptions
});

const port = process.env.PORT || 3000;

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const contactosRoutes = require('./routes/contactosRoutes');
const chatRoutes = require('./routes/chatRoutes'); // <-- 1. Agrega esta línea

// Usar las rutas
app.use('/auth', authRoutes);
app.use('/contactos', contactosRoutes); 
app.use('/chat', chatRoutes); // <-- 2. Y agrega esta línea

// --- LÓGICA DEL CHAT EN TIEMPO REAL (SOCKET.IO) ---
io.on('connection', (socket) => {
  console.log('⚡ Un usuario se ha conectado al chat:', socket.id);

  // Cuando un usuario inicia sesión, lo metemos en una "sala" privada con su propio ID
  socket.on('conectar_usuario', (userId) => {
    socket.join(userId.toString());
    console.log(`👤 Usuario ID: ${userId} en línea y listo para chatear.`);
  });

  // Cuando un usuario envía un mensaje a otro
  socket.on('enviar_mensaje', (data) => {
    // data traerá: { remitente_id, receptor_id, contenido }
    console.log('📨 Nuevo mensaje circulando:', data);
    
    // Le enviamos el mensaje al receptor
    io.to(data.receptor_id.toString()).emit('recibir_mensaje', data);
    
    // También se lo enviamos de vuelta al remitente para que aparezca en su pantalla
    io.to(data.remitente_id.toString()).emit('recibir_mensaje', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Un usuario se desconectó:', socket.id);
  });
});
// ---------------------------------------------------

// 5. CAMBIO VITAL: Ahora usamos 'server.listen' en lugar de 'app.listen'
server.listen(port, () => {
  console.log(`🚀 Servidor Express y Socket.io corriendo correctamente en el puerto ${port}`);
});