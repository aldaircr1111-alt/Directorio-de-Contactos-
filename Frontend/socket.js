import { io } from "socket.io-client";

// Aquí ponemos la URL de tu Backend en Render. 
// (Asegúrate de cambiar esto si tu URL de render es diferente)
const URL = "https://directorio-backend-bnfl.onrender.com"; 

// Configuramos el socket, pero le decimos que NO se conecte automáticamente.
// Solo lo conectaremos cuando el usuario inicie sesión correctamente.
export const socket = io(URL, {
  autoConnect: false,
});