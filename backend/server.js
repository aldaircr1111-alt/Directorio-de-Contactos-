const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Importamos el módulo HTTP nativo de Node
const { Server } = require('socket.io'); // 2. Importamos Socket.io

const app = express();

// 3. Envolvemos la app de Express en un servidor HTTP
const server = http.createServer(app);

// 💥 EL PASE VIP UNIVERSAL PARA CORS (EL ARREGLO ESTÁ AQUÍ)
const corsOptions = {
  origin: "*", // <--- Esto deja entrar cualquier conexión (Render o Local) sin bloquearla
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());

// 4. Inicializamos Socket.io pegado a nuestro nuevo servidor usando el Pase VIP
const io = new Server(server, {
  cors: corsOptions
});

const port = process.env.PORT || 3000;

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const contactosRoutes = require('./routes/contactosRoutes');
const chatRoutes = require('./routes/chatRoutes');

// Usar las rutas
app.use('/auth', authRoutes);
app.use('/contactos', contactosRoutes); 
app.use('/chat', chatRoutes);

// --- LÓGICA DEL CHAT EN TIEMPO REAL (SOCKET.IO) ---
io.on('connection', (socket) => {
  console.log('⚡ Un usuario se ha conectado al chat:', socket.id);

  // El usuario crea su sala privada usando su NÚMERO DE TELÉFONO
  socket.on('conectar_usuario', (telefono) => {
    socket.join(telefono.toString());
    console.log(`📱 Teléfono: ${telefono} en línea y conectado.`);
  });

  // Cuando se envía un mensaje
  socket.on('enviar_mensaje', (data) => {
    console.log('📨 Mensaje en tránsito:', data);
    
    // Le enviamos el mensaje al receptor usando su teléfono
    io.to(data.receptor_telefono.toString()).emit('recibir_mensaje', data);
    
    // Y te lo devolvemos a ti mismo (remitente_telefono) para que aparezca en tu pantalla verde
    io.to(data.remitente_telefono.toString()).emit('recibir_mensaje', data);
  });

  socket.on('disconnect', () => {
    console.log('❌ Un usuario se desconectó:', socket.id);
  });
});
// ---------------------------------------------------

// 5. Arrancamos el servidor
server.listen(port, () => {
  console.log(`🚀 Servidor Express y Socket.io corriendo correctamente en el puerto ${port}`);
});