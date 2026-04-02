<template>
  <div class="directorio-container">
    <header class="cabecera">
      <h1>Mi Directorio de Contactos</h1>
      <button @click="cerrarSesion" class="btn-salir">Cerrar Sesión</button>
    </header>

    <main class="contenido">
      <section class="panel-agregar">
        <h2>{{ modoEdicion ? 'Editar Contacto' : 'Nuevo Contacto' }}</h2>
        
        <form @submit.prevent="guardarContacto">
          <div class="grupo-input">
            <label>Nombre:</label>
            <input type="text" v-model="formulario.nombre" required placeholder="Ej: Juan Pérez" />
          </div>
          <div class="grupo-input">
            <label>Teléfono:</label>
            <input type="text" v-model="formulario.telefono" required placeholder="Ej: 3001234567" />
          </div>
          <div class="grupo-input">
            <label>Categoría:</label>
            <select v-model="formulario.categoria" required>
              <option value="" disabled>Selecciona una...</option>
              <option value="Familia">Familia</option>
              <option value="Amigos">Amigos</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Universidad">Universidad</option>
            </select>
          </div>
          
          <button type="submit" class="btn-principal">
            {{ modoEdicion ? 'Actualizar Contacto' : 'Guardar Contacto' }}
          </button>
          
          <button v-if="modoEdicion" type="button" @click="cancelarEdicion" class="btn-secundario">
            Cancelar
          </button>
        </form>
        <p v-if="mensaje" :class="['mensaje-feedback', tipoMensaje]">{{ mensaje }}</p>
      </section>

      <section class="panel-lista">
        <h2>Mis Contactos</h2>
        <div class="buscador">
          <input type="text" v-model="busqueda" placeholder="🔍 Buscar por nombre o categoría..." />
        </div>

        <div class="lista-grid">
          <p v-if="contactosFiltrados.length === 0" class="sin-contactos">
            No hay contactos para mostrar.
          </p>
          
          <div v-for="contacto in contactosFiltrados" :key="contacto.id" class="tarjeta-contacto">
            <div class="info-principal">
              <div>
                <h3>{{ contacto.nombre }}</h3>
                <p class="telefono">📞 {{ contacto.telefono }}</p>
              </div>
              <span :class="['etiqueta', contacto.categoria.toLowerCase()]">{{ contacto.categoria }}</span>
            </div>
            
            <div class="acciones">
              <button @click="prepararEdicion(contacto)" title="Editar" class="btn-icono editar">✏️</button>
              <button @click="eliminarContacto(contacto.id)" title="Eliminar" class="btn-icono eliminar">🗑️</button>
            </div>
          </div>
        </div>
      </section>
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

// URL BASE APUNTANDO A RENDER
const API_URL = 'https://directorio-de-contactos-backend.onrender.com/contactos';

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
.directorio-container { min-height: 100vh; background-color: #f4f7f6; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
.cabecera { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
.cabecera h1 { color: #2c3e50; font-size: 1.5rem; margin: 0; }
.btn-salir { padding: 8px 16px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-salir:hover { background-color: #c0392b; }

.contenido { display: flex; gap: 20px; align-items: flex-start; }
@media (max-width: 768px) { .contenido { flex-direction: column; } }

.panel-agregar { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); flex: 1; min-width: 300px; position: sticky; top: 20px; }
.panel-agregar h2 { color: #34495e; margin-bottom: 20px; font-size: 1.2rem; }
.grupo-input { margin-bottom: 15px; }
.grupo-input label { display: block; margin-bottom: 5px; color: #7f8c8d; font-size: 0.9rem; }
.grupo-input input, .grupo-input select { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; outline: none; }
.grupo-input input:focus, .grupo-input select:focus { border-color: #3498db; }

.btn-principal { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
.btn-principal:hover { background-color: #2980b9; }
.btn-secundario { width: 100%; padding: 12px; background-color: #95a5a6; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
.btn-secundario:hover { background-color: #7f8c8d; }

.mensaje-feedback { text-align: center; margin-top: 10px; font-weight: bold; }
.mensaje-feedback.exito { color: #27ae60; }
.mensaje-feedback.error { color: #c0392b; }

.panel-lista { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); flex: 2; width: 100%; }
.panel-lista h2 { color: #34495e; margin-bottom: 20px; font-size: 1.2rem; }
.buscador input { width: 100%; padding: 12px; border: 1px solid #bdc3c7; border-radius: 5px; margin-bottom: 20px; font-size: 1rem; }
.sin-contactos { text-align: center; color: #95a5a6; padding: 20px; }

.lista-grid { display: flex; flex-direction: column; gap: 15px; }
.tarjeta-contacto { border: 1px solid #ecf0f1; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
.tarjeta-contacto:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-color: #bdc3c7; }
.info-principal { display: flex; align-items: center; gap: 20px; flex-grow: 1; justify-content: space-between; margin-right: 20px;}
.info-principal h3 { margin: 0 0 5px 0; color: #2c3e50; font-size: 1.1rem; }
.telefono { color: #7f8c8d; margin: 0; font-weight: 500; font-size: 0.9rem;}

.etiqueta { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; white-space: nowrap; }
.etiqueta.familia { background-color: #ffeaa7; color: #d35400; }
.etiqueta.amigos { background-color: #81ecec; color: #00b894; }
.etiqueta.trabajo { background-color: #fab1a0; color: #c0392b; }
.etiqueta.universidad { background-color: #a29bfe; color: #6c5ce7; }

.acciones { display: flex; gap: 10px; }
.btn-icono { background: none; border: none; font-size: 1.2rem; cursor: pointer; transition: transform 0.2s; padding: 5px; border-radius: 5px;}
.btn-icono:hover { transform: scale(1.1); background-color: #ecf0f1; }
</style>