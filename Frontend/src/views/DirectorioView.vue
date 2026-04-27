<template>
  <div class="whatsapp-container">
    
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
      </div>

      <div class="lista-contactos">
        <p v-if="contactosFiltrados.length === 0" class="sin-contactos">No hay contactos.</p>
        
        <div 
          v-for="contacto in contactosFiltrados" 
          :key="contacto.id" 
          class="item-contacto"
          @click="prepararEdicion(contacto)"
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

    <main class="panel-derecho">
      <header class="cabecera-derecha">
        <h2>{{ modoEdicion ? 'Detalles del Contacto' : 'Añadir Nuevo Contacto' }}</h2>
      </header>

      <div class="zona-formulario">
        <div class="tarjeta-formulario">
          <form @submit.prevent="guardarContacto">
            <div class="grupo-input">
              <label>Nombre:</label>
              <input type="text" v-model="formulario.nombre" required placeholder="Ej: Juan Pérez" />
            </div>
            
            <div class="grupo-input">
              <label>Teléfono:</label>
              <input type="text" v-model="formulario.telefono" required placeholder="Ej: 300 123 4567" />
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
                {{ modoEdicion ? 'Actualizar Contacto' : 'Guardar Nuevo' }}
              </button>
              
              <button v-if="modoEdicion" type="button" @click="eliminarContacto(contactoIdActivo)" class="btn-eliminar">
                Eliminar
              </button>
              
              <button v-if="modoEdicion" type="button" @click="cancelarEdicion" class="btn-cancelar">
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
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const contactos = ref([]);
const busqueda = ref('');
const mensaje = ref('');
const tipoMensaje = ref('exito');

const modoEdicion = ref(false);
const contactoIdActivo = ref(null);
const formulario = ref({ nombre: '', telefono: '', categoria: '' });

// Asegúrate de que esta URL apunte a tu backend (Local o Render)
const API_URL = 'http://localhost:3000/contactos';

const obtenerContactos = async () => {
  try {
    const respuesta = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    contactos.value = respuesta.data;
  } catch (error) {
    if (error.response?.status === 401 || error.response?.status === 403) cerrarSesion();
  }
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
      mensaje.value = '¡Contacto actualizado!';
    } else {
      const respuesta = await axios.post(API_URL, formulario.value, cabeceras);
      contactos.value.push(respuesta.data.contacto);
      mensaje.value = '¡Contacto guardado!';
    }

    cancelarEdicion();
    setTimeout(() => mensaje.value = '', 3000);
  } catch (error) {
    mensaje.value = 'Error al procesar la solicitud.';
    tipoMensaje.value = 'error';
  }
};

const eliminarContacto = async (id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este contacto?')) return;

  try {
    await axios.delete(`${API_URL}/${id}`, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
    contactos.value = contactos.value.filter(c => c.id !== id);
    cancelarEdicion();
  } catch (error) {
    console.error(error);
    alert('Hubo un error al eliminar el contacto');
  }
};

const prepararEdicion = (contacto) => {
  modoEdicion.value = true;
  contactoIdActivo.value = contacto.id;
  formulario.value = { nombre: contacto.nombre, telefono: contacto.telefono, categoria: contacto.categoria };
};

const cancelarEdicion = () => {
  modoEdicion.value = false;
  contactoIdActivo.value = null;
  formulario.value = { nombre: '', telefono: '', categoria: '' };
};

const contactosFiltrados = computed(() => {
  if (!busqueda.value) return contactos.value;
  const termino = busqueda.value.toLowerCase();
  return contactos.value.filter(c => 
    c.nombre.toLowerCase().includes(termino) || c.categoria.toLowerCase().includes(termino)
  );
});

const cerrarSesion = () => {
  authStore.logout();
  router.push('/');
};

onMounted(() => { obtenerContactos(); });
</script>

<style scoped>
/* RESET Y CONTENEDOR PRINCIPAL ESTILO WHATSAPP */
.whatsapp-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #d1d7db;
  overflow: hidden;
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
}

/* --- PANEL IZQUIERDO --- */
.panel-izquierdo {
  width: 30%;
  min-width: 350px;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #d1d7db;
}

.cabecera-perfil {
  background-color: #f0f2f5;
  padding: 10px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  border-bottom: 1px solid #d1d7db;
}

.perfil-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar-usuario {
  width: 40px;
  height: 40px;
  background-color: #dfe5e7;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
}

.nombre-usuario { margin: 0; font-size: 1rem; color: #111b21; }
.telefono-usuario { margin: 0; font-size: 0.8rem; color: #667781; }

.btn-salir {
  background: none; border: none; font-size: 1.2rem; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s;
}
.btn-salir:hover { background-color: #e5eaea; }

.zona-buscador {
  padding: 8px 12px;
  background-color: #ffffff;
  border-bottom: 1px solid #f2f2f2;
}

.input-buscador {
  background-color: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  height: 35px;
}

.input-buscador input {
  border: none; background: transparent; width: 100%; padding: 8px; outline: none; font-size: 0.9rem;
}

.lista-contactos {
  flex-grow: 1; overflow-y: auto; background-color: #ffffff;
}

.item-contacto {
  display: flex; padding: 12px 16px; border-bottom: 1px solid #f2f2f2; cursor: pointer; transition: background 0.2s;
}
.item-contacto:hover { background-color: #f5f6f6; }

.avatar-contacto {
  width: 48px; height: 48px; background-color: #00a884; color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; font-weight: bold; margin-right: 15px;
}

.info-contacto { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; }
.fila-superior { display: flex; justify-content: space-between; align-items: center; }
.fila-superior h4 { margin: 0; font-size: 1.05rem; color: #111b21; font-weight: 400; }
.numero-contacto { margin: 4px 0 0 0; font-size: 0.85rem; color: #667781; }

.etiqueta { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.etiqueta.familia { background-color: #ffeaa7; color: #d35400; }
.etiqueta.amigos { background-color: #81ecec; color: #00b894; }
.etiqueta.trabajo { background-color: #fab1a0; color: #c0392b; }
.etiqueta.universidad { background-color: #a29bfe; color: #6c5ce7; }

/* --- PANEL DERECHO --- */
.panel-derecho {
  flex-grow: 1; display: flex; flex-direction: column; background-color: #efeae2;
  /* Fondo estilo WhatsApp */
  background-image: url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png');
  background-size: contain;
}

.cabecera-derecha {
  background-color: #f0f2f5; padding: 10px 16px; height: 60px; display: flex; align-items: center; border-bottom: 1px solid #d1d7db;
}
.cabecera-derecha h2 { margin: 0; font-size: 1rem; color: #111b21; font-weight: 500; }

.zona-formulario {
  flex-grow: 1; display: flex; justify-content: center; align-items: center; padding: 20px;
}

.tarjeta-formulario {
  background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); width: 100%; max-width: 450px;
}

.grupo-input { margin-bottom: 20px; }
.grupo-input label { display: block; margin-bottom: 8px; color: #111b21; font-weight: 500; font-size: 0.9rem; }
.grupo-input input, .grupo-input select {
  width: 100%; padding: 10px 12px; border: 1px solid #d1d7db; border-radius: 8px; font-size: 1rem; outline: none; transition: border 0.3s;
}
.grupo-input input:focus, .grupo-input select:focus { border-color: #00a884; }

.botones-accion { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 25px; }

.btn-guardar { flex-grow: 1; background-color: #00a884; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-guardar:hover { background-color: #008f6f; }

.btn-eliminar { background-color: #ef4444; color: white; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-eliminar:hover { background-color: #dc2626; }

.btn-cancelar { background-color: #f0f2f5; color: #111b21; border: none; padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s; }
.btn-cancelar:hover { background-color: #d1d7db; }

.mensaje-feedback { text-align: center; margin-top: 15px; font-weight: bold; font-size: 0.9rem; }
.mensaje-feedback.exito { color: #00a884; }
.mensaje-feedback.error { color: #ef4444; }
</style>