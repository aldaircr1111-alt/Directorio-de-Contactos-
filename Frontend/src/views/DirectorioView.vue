<template>
  <div class="whatsapp-container">
    
    <!-- PANEL IZQUIERDO -->
    <aside class="panel-izquierdo">
      <header class="cabecera-perfil">
        <div class="perfil-info" v-if="authStore.user">
          <div class="avatar-usuario">👤</div>
          <div>
            <h3 class="nombre-usuario">{{ authStore.user.username }}</h3>
            <span class="telefono-usuario">{{ authStore.user.telefono || 'Sin teléfono' }}</span>
          </div>
        </div>
        <button @click="cerrarSesion" class="btn-salir" title="Cerrar Sesión">🚪</button>
      </header>

      <div class="zona-buscador">
        <div class="input-buscador">
          <span>🔍</span>
          <input type="text" v-model="busqueda" placeholder="Buscar un contacto..." />
        </div>
        <!-- BOTÓN NUEVO CONTACTO -->
        <button @click="prepararNuevoContacto" class="btn-nuevo-contacto" title="Añadir Contacto">➕</button>
      </div>

      <div class="lista-contactos">
        <p v-if="contactosFiltrados.length === 0" class="sin-contactos">No hay contactos.</p>
        
        <div 
          v-for="contacto in contactosFiltrados" 
          :key="contacto.id" 
          :class="['item-contacto', contactoChatActivo?.id === contacto.id ? 'activo' : '']"
          @click="abrirChat(contacto)"
        >
          <div class="avatar-contacto">{{ contacto.nombre.charAt(0).toUpperCase() }}</div>
          <div class="info-contacto">
            <div class="fila-superior">
              <h4>{{ contacto.nombre }}</h4>
              <span :class="['etiqueta', contacto.categoria.toLowerCase()]">{{ contacto.categoria }}</span>
            </div>
            <p class="numero-contacto">{{ contacto.telefono }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- PANEL DERECHO -->
    <main class="panel-derecho">
      
      <!-- PANTALLA DE CHAT -->
      <div v-if="modoChat" class="contenedor-chat">
        <header class="cabecera-chat">
          <div class="info-chat-activo">
            <div class="avatar-contacto pequeña">{{ contactoChatActivo.nombre.charAt(0).toUpperCase() }}</div>
            <div>
              <h3>{{ contactoChatActivo.nombre }}</h3>
              <span>{{ contactoChatActivo.telefono }}</span>
            </div>
          </div>
          <button @click="prepararEdicion(contactoChatActivo)" class="btn-icono" title="Ver Detalles">⚙️ Info</button>
        </header>

        <div class="area-mensajes" id="caja-mensajes">
          <div v-if="mensajesChat.length === 0" class="mensaje-vacio">
            <p>Envía un mensaje para iniciar la conversación.</p>
          </div>
          
          <div 
            v-for="msg in mensajesChat" 
            :key="msg.id || Math.random()" 
            :class="['mensaje', msg.remitente_telefono === authStore.user.telefono ? 'mio' : 'otro']"
          >
            <p>{{ msg.contenido }}</p>
            <span class="hora">{{ formatearHora(msg.fecha_envio) }}</span>
          </div>
        </div>

        <div class="zona-input-chat">
          <form @submit.prevent="enviarMensaje">
            <input type="text" v-model="nuevoMensaje" placeholder="Escribe un mensaje..." required />
            <button type="submit" class="btn-enviar">▶️</button>
          </form>
        </div>
      </div>

      <!-- PANTALLA DE FORMULARIO (Añadir/Editar) -->
      <div v-else class="zona-formulario">
        <div class="tarjeta-formulario">
          <header class="cabecera-derecha">
             <h2>{{ modoEdicion ? 'Detalles del Contacto' : 'Añadir Nuevo Contacto' }}</h2>
          </header>

          <form @submit.prevent="guardarContacto">
            <div class="grupo-input mt-4">
              <label>Nombre:</label>
              <input type="text" v-model="formulario.nombre" required placeholder="Ej: Juan Pérez" />
            </div>
            
            <div class="grupo-input">
              <label>Teléfono (Debe ser el número exacto del usuario):</label>
              <input type="text" v-model="formulario.telefono" required placeholder="Ej: 3001234567" />
            </div>
            
            <div class="grupo-input">
              <label>Categoría:</label>
              <select v-model="formulario.categoria" required>
                <option value="" disabled>Selecciona una categoría...</option>
                <option value="Familia">Familia</option>
                <option value="Amigos">Amigos</option>
                <option value="Trabajo">Trabajo</option>
                <option value="Universidad">Universidad</option>
              </select>
            </div>
            
            <div class="botones-accion">
              <button type="submit" class="btn-guardar">
                {{ modoEdicion ? 'Actualizar' : 'Guardar' }}
              </button>
              
              <button v-if="modoEdicion" type="button" @click="eliminarContacto(contactoIdActivo)" class="btn-eliminar">
                Eliminar
              </button>
              
              <button type="button" @click="cerrarFormulario" class="btn-cancelar">
                Cancelar
              </button>
            </div>
          </form>
          <p v-if="mensaje" :class="['mensaje-feedback', tipoMensaje]">{{ mensaje }}</p>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { socket } from '../socket.js'; // Importamos la antena

const router = useRouter();
const authStore = useAuthStore();

// Estados Generales
const contactos = ref([]);
const busqueda = ref('');
const mensaje = ref('');
const tipoMensaje = ref('exito');

// Estados del Formulario
const modoEdicion = ref(false);
const contactoIdActivo = ref(null);
const formulario = ref({ nombre: '', telefono: '', categoria: '' });

// Estados del Chat
const modoChat = ref(false);
const contactoChatActivo = ref(null);
const mensajesChat = ref([]);
const nuevoMensaje = ref('');

const API_URL = 'https://directorio-backend-bnfl.onrender.com/contactos';
const API_CHAT = 'https://directorio-backend-bnfl.onrender.com/chat';

// --- FUNCIONES DE SOCKET Y CHAT ---
const inicializarSocket = () => {
  if (authStore.user) {
    socket.connect();
    // Le decimos al servidor quiénes somos usando nuestro teléfono
    socket.emit('conectar_usuario', authStore.user.telefono);
  }

  socket.on('recibir_mensaje', (data) => {
    // Solo agregamos el mensaje a la pantalla si tenemos el chat abierto con esa persona
    if (
      modoChat.value &&
      contactoChatActivo.value &&
      (data.remitente_telefono === contactoChatActivo.value.telefono || data.receptor_telefono === contactoChatActivo.value.telefono)
    ) {
      mensajesChat.value.push(data);
      hacerScrollAbajo();
    }
  });
};

const abrirChat = async (contacto) => {
  modoChat.value = true;
  modoEdicion.value = false;
  contactoChatActivo.value = contacto;
  mensajesChat.value = []; // Limpiamos la pantalla antes de cargar

  try {
    const respuesta = await axios.get(`${API_CHAT}/${contacto.telefono}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    mensajesChat.value = respuesta.data;
    hacerScrollAbajo();
  } catch (error) {
    console.error("Aún no hay historial o error al cargar", error);
  }
};

const enviarMensaje = async () => {
  if (!nuevoMensaje.value.trim()) return;

  const dataMensaje = {
    remitente_telefono: authStore.user.telefono,
    receptor_telefono: contactoChatActivo.value.telefono,
    contenido: nuevoMensaje.value,
    fecha_envio: new Date().toISOString()
  };

  // Emitimos el mensaje para que viaje a la velocidad de la luz
  socket.emit('enviar_mensaje', dataMensaje);

  try {
    // También lo guardamos en la base de datos
    await axios.post(API_CHAT, dataMensaje, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
  } catch (e) {
    console.error("Error guardando el mensaje", e);
  }

  nuevoMensaje.value = '';
};

const hacerScrollAbajo = async () => {
  await nextTick();
  const caja = document.getElementById('caja-mensajes');
  if (caja) caja.scrollTop = caja.scrollHeight;
};

const formatearHora = (fechaIso) => {
  if (!fechaIso) return '';
  const fecha = new Date(fechaIso);
  return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// --- FUNCIONES DE CONTACTOS ---
const obtenerContactos = async () => {
  try {
    const respuesta = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    contactos.value = respuesta.data;
  } catch (error) {
    if (error.response?.status === 401) cerrarSesion();
  }
};

const prepararNuevoContacto = () => {
  modoChat.value = false;
  modoEdicion.value = false;
  formulario.value = { nombre: '', telefono: '', categoria: '' };
};

const prepararEdicion = (contacto) => {
  modoChat.value = false;
  modoEdicion.value = true;
  contactoIdActivo.value = contacto.id;
  formulario.value = { nombre: contacto.nombre, telefono: contacto.telefono, categoria: contacto.categoria };
};

const guardarContacto = async () => {
  mensaje.value = 'Procesando...';
  tipoMensaje.value = 'exito';

  try {
    const cabeceras = { headers: { Authorization: `Bearer ${authStore.token}` } };
    if (modoEdicion.value) {
      const respuesta = await axios.put(`${API_URL}/${contactoIdActivo.value}`, formulario.value, cabeceras);
      const index = contactos.value.findIndex(c => c.id === contactoIdActivo.value);
      if (index !== -1) contactos.value[index] = respuesta.data.contacto;
      mensaje.value = '¡Actualizado!';
      // Regresamos al chat después de editar
      abrirChat(contactos.value[index]);
    } else {
      const respuesta = await axios.post(API_URL, formulario.value, cabeceras);
      contactos.value.push(respuesta.data.contacto);
      mensaje.value = '¡Guardado!';
      cerrarFormulario();
    }
    setTimeout(() => mensaje.value = '', 3000);
  } catch (error) {
    mensaje.value = 'Error en la solicitud.';
    tipoMensaje.value = 'error';
  }
};

const eliminarContacto = async (id) => {
  if (!confirm('¿Eliminar este contacto?')) return;
  try {
    await axios.delete(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${authStore.token}` } });
    contactos.value = contactos.value.filter(c => c.id !== id);
    cerrarFormulario();
  } catch (error) {
    alert('Error al eliminar');
  }
};

const cerrarFormulario = () => {
  modoEdicion.value = false;
  modoChat.value = false;
};

const cerrarSesion = () => {
  socket.disconnect(); // Apagamos la antena al salir
  authStore.logout();
  router.push('/');
};

const contactosFiltrados = computed(() => {
  if (!busqueda.value) return contactos.value;
  const termino = busqueda.value.toLowerCase();
  return contactos.value.filter(c => c.nombre.toLowerCase().includes(termino) || c.categoria.toLowerCase().includes(termino));
});

onMounted(() => { 
  obtenerContactos();
  inicializarSocket();
});
</script>

<style scoped>
/* RESET Y CONTENEDOR */
.whatsapp-container { display: flex; height: 100vh; width: 100vw; background-color: #d1d7db; font-family: 'Segoe UI', Arial, sans-serif; }

/* PANEL IZQUIERDO */
.panel-izquierdo { width: 30%; min-width: 350px; background-color: #ffffff; display: flex; flex-direction: column; border-right: 1px solid #d1d7db; }
.cabecera-perfil { background-color: #f0f2f5; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; height: 60px; border-bottom: 1px solid #d1d7db; }
.perfil-info { display: flex; align-items: center; gap: 10px; }
.avatar-usuario { width: 40px; height: 40px; background-color: #dfe5e7; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; }
.nombre-usuario { margin: 0; font-size: 1rem; color: #111b21; }
.telefono-usuario { margin: 0; font-size: 0.8rem; color: #667781; }
.btn-salir { background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s; }
.btn-salir:hover { background-color: #e5eaea; }

.zona-buscador { display: flex; gap: 10px; align-items: center; padding: 8px 12px; background-color: #ffffff; border-bottom: 1px solid #f2f2f2; }
.input-buscador { background-color: #f0f2f5; border-radius: 8px; display: flex; align-items: center; padding: 0 10px; height: 35px; flex-grow: 1; }
.input-buscador input { border: none; background: transparent; width: 100%; padding: 8px; outline: none; font-size: 0.9rem; }
.btn-nuevo-contacto { background-color: #00a884; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; font-size: 1.2rem; cursor: pointer; display: flex; justify-content: center; align-items: center; transition: 0.2s;}
.btn-nuevo-contacto:hover { background-color: #008f6f; }

.lista-contactos { flex-grow: 1; overflow-y: auto; background-color: #ffffff; }
.sin-contactos { text-align: center; color: #667781; margin-top: 20px; }
.item-contacto { display: flex; padding: 12px 16px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: background 0.2s; }
.item-contacto:hover { background-color: #f5f6f6; }
.item-contacto.activo { background-color: #f0f2f5; }

.avatar-contacto { width: 48px; height: 48px; background-color: #00a884; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; font-weight: bold; margin-right: 15px; }
.avatar-contacto.pequeña { width: 40px; height: 40px; font-size: 1rem; margin-right: 0;}
.info-contacto { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
.fila-superior { display: flex; justify-content: space-between; align-items: center; }
.fila-superior h4 { margin: 0; font-size: 1.05rem; color: #111b21; font-weight: 400; }
.numero-contacto { margin: 4px 0 0 0; font-size: 0.85rem; color: #667781; }

.etiqueta { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.etiqueta.familia { background-color: #ffeaa7; color: #d35400; }
.etiqueta.amigos { background-color: #81ecec; color: #00b894; }
.etiqueta.trabajo { background-color: #fab1a0; color: #c0392b; }
.etiqueta.universidad { background-color: #a29bfe; color: #6c5ce7; }

/* PANEL DERECHO */
.panel-derecho { flex-grow: 1; display: flex; flex-direction: column; background-color: #efeae2; background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png'); background-size: contain; position: relative; }

/* CHAT ZONE */
.contenedor-chat { display: flex; flex-direction: column; height: 100%; width: 100%; }
.cabecera-chat { background-color: #f0f2f5; padding: 10px 16px; height: 60px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #d1d7db; }
.info-chat-activo { display: flex; align-items: center; gap: 12px; }
.info-chat-activo h3 { margin: 0; font-size: 1rem; color: #111b21; }
.info-chat-activo span { margin: 0; font-size: 0.8rem; color: #667781; }
.btn-icono { background: none; border: none; cursor: pointer; color: #667781; font-weight: bold; padding: 8px; transition: 0.2s;}
.btn-icono:hover { background-color: #e5eaea; border-radius: 5px; }

.area-mensajes { flex-grow: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
.mensaje-vacio { text-align: center; margin-top: auto; margin-bottom: auto; background: rgba(255,255,255,0.8); padding: 10px 20px; border-radius: 10px; color: #667781; align-self: center;}
.mensaje { max-width: 65%; padding: 8px 12px; border-radius: 8px; position: relative; font-size: 0.95rem; line-height: 1.4; box-shadow: 0 1px 0.5px rgba(0,0,0,0.13); }
.mensaje p { margin: 0 0 5px 0; color: #111b21; word-wrap: break-word; }
.mensaje .hora { font-size: 0.65rem; color: #667781; float: right; margin-top: 2px; }
.mensaje.mio { background-color: #d9fdd3; align-self: flex-end; border-top-right-radius: 0; }
.mensaje.otro { background-color: #ffffff; align-self: flex-start; border-top-left-radius: 0; }

.zona-input-chat { background-color: #f0f2f5; padding: 12px 20px; display: flex; align-items: center; }
.zona-input-chat form { display: flex; width: 100%; gap: 10px; align-items: center; }
.zona-input-chat input { flex-grow: 1; padding: 12px; border: none; border-radius: 8px; font-size: 1rem; outline: none; }
.btn-enviar { background-color: #00a884; color: white; border: none; width: 45px; height: 45px; border-radius: 50%; display: flex; justify-content: center; align-items: center; cursor: pointer; font-size: 1.2rem; transition: 0.2s; }
.btn-enviar:hover { background-color: #008f6f; }

/* FORMULARIO ZONE */
.zona-formulario { position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; justify-content: center; align-items: center; background-color: rgba(255,255,255,0.9); z-index: 10;}
.tarjeta-formulario { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.15); width: 100%; max-width: 450px; }
.cabecera-derecha { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;}
.cabecera-derecha h2 { margin: 0; font-size: 1.2rem; color: #111b21; font-weight: 500; }
.grupo-input { margin-bottom: 15px; }
.grupo-input label { display: block; margin-bottom: 8px; color: #111b21; font-weight: 500; font-size: 0.9rem; }
.grupo-input input, .grupo-input select { width: 100%; padding: 10px 12px; border: 1px solid #d1d7db; border-radius: 8px; font-size: 1rem; outline: none; }
.grupo-input input:focus, .grupo-input select:focus { border-color: #00a884; }

.botones-accion { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 25px; }
.btn-guardar { flex-grow: 1; background-color: #00a884; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-guardar:hover { background-color: #008f6f; }
.btn-eliminar { background-color: #ef4444; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
.btn-cancelar { background-color: #f0f2f5; color: #111b21; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }

.mt-4 { margin-top: 1rem; }
.mensaje-feedback { text-align: center; margin-top: 15px; font-weight: bold; font-size: 0.9rem; }
.mensaje-feedback.exito { color: #00a884; }
.mensaje-feedback.error { color: #ef4444; }
</style>