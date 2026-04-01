<template>
  <div class="directorio-container">
    <header class="cabecera">
      <h1>Mi Directorio de Contactos</h1>
      <button @click="cerrarSesion" class="btn-salir">Cerrar Sesión</button>
    </header>

    <main class="contenido">
      <section class="panel-agregar">
        <h2>Nuevo Contacto</h2>
        <form @submit.prevent="agregarContacto">
          <div class="grupo-input">
            <label>Nombre:</label>
            <input type="text" v-model="nuevoContacto.nombre" required placeholder="Ej: Juan Pérez" />
          </div>
          <div class="grupo-input">
            <label>Teléfono:</label>
            <input type="text" v-model="nuevoContacto.telefono" required placeholder="Ej: 3001234567" />
          </div>
          <div class="grupo-input">
            <label>Categoría:</label>
            <select v-model="nuevoContacto.categoria" required>
              <option value="" disabled>Selecciona una...</option>
              <option value="Familia">Familia</option>
              <option value="Amigos">Amigos</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Universidad">Universidad</option>
            </select>
          </div>
          <button type="submit" class="btn-principal">Guardar Contacto</button>
        </form>
        <p v-if="mensaje" class="mensaje-feedback">{{ mensaje }}</p>
      </section>

      <section class="panel-lista">
        <h2>Mis Contactos</h2>
        
        <div class="buscador">
          <input 
            type="text" 
            v-model="busqueda" 
            placeholder="🔍 Buscar por nombre o categoría..." 
          />
        </div>

        <div class="lista-grid">
          <p v-if="contactosFiltrados.length === 0" class="sin-contactos">
            No hay contactos para mostrar.
          </p>
          
          <div v-for="contacto in contactosFiltrados" :key="contacto.id" class="tarjeta-contacto">
            <div class="info-principal">
              <h3>{{ contacto.nombre }}</h3>
              <span :class="['etiqueta', contacto.categoria.toLowerCase()]">{{ contacto.categoria }}</span>
            </div>
            <p class="telefono">📞 {{ contacto.telefono }}</p>
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

const router = useRouter();

// Variables reactivas
const contactos = ref([]);
const busqueda = ref('');
const mensaje = ref('');
const nuevoContacto = ref({
  nombre: '',
  telefono: '',
  categoria: ''
});

// 1. Función para obtener los contactos al cargar la página
const obtenerContactos = async () => {
  const token = localStorage.getItem('token');
  try {
    const respuesta = await axios.get('http://localhost:3000/contactos', {
      headers: { Authorization: `Bearer ${token}` }
    });
    contactos.value = respuesta.data;
  } catch (error) {
    console.error("Error al obtener contactos:", error);
    if (error.response?.status === 401 || error.response?.status === 403) {
      cerrarSesion(); // Si el token expiró, lo sacamos
    }
  }
};

// 2. Función para guardar un contacto nuevo
const agregarContacto = async () => {
  const token = localStorage.getItem('token');
  mensaje.value = 'Guardando...';
  
  try {
    const respuesta = await axios.post('http://localhost:3000/contactos', nuevoContacto.value, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Agregamos el contacto nuevo a la lista visual inmediatamente
    contactos.value.push(respuesta.data.contacto);
    mensaje.value = '¡Guardado!';
    
    // Limpiamos el formulario
    nuevoContacto.value = { nombre: '', telefono: '', categoria: '' };
    
    setTimeout(() => mensaje.value = '', 3000);
  } catch (error) {
    mensaje.value = 'Error al guardar.';
    console.error(error);
  }
};

// 3. Propiedad computada para el buscador (filtra en tiempo real)
const contactosFiltrados = computed(() => {
  if (!busqueda.value) return contactos.value;
  
  const termino = busqueda.value.toLowerCase();
  return contactos.value.filter(c => 
    c.nombre.toLowerCase().includes(termino) || 
    c.categoria.toLowerCase().includes(termino)
  );
});

// 4. Cerrar sesión
const cerrarSesion = () => {
  localStorage.removeItem('token');
  router.push('/');
};

// Ejecutamos obtenerContactos() apenas la pantalla carga
onMounted(() => {
  obtenerContactos();
});
</script>

<style scoped>
/* Estilos generales */
.directorio-container { min-height: 100vh; background-color: #f4f7f6; padding: 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
.cabecera { display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px; }
.cabecera h1 { color: #2c3e50; font-size: 1.5rem; margin: 0; }
.btn-salir { padding: 8px 16px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; transition: 0.3s; }
.btn-salir:hover { background-color: #c0392b; }

/* Layout principal */
.contenido { display: flex; gap: 20px; align-items: flex-start; }
@media (max-width: 768px) { .contenido { flex-direction: column; } }

/* Panel Izquierdo (Formulario) */
.panel-agregar { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); flex: 1; min-width: 300px; }
.panel-agregar h2 { color: #34495e; margin-bottom: 20px; font-size: 1.2rem; }
.grupo-input { margin-bottom: 15px; }
.grupo-input label { display: block; margin-bottom: 5px; color: #7f8c8d; font-size: 0.9rem; }
.grupo-input input, .grupo-input select { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; outline: none; }
.grupo-input input:focus, .grupo-input select:focus { border-color: #3498db; }
.btn-principal { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: 0.3s; margin-top: 10px; }
.btn-principal:hover { background-color: #2980b9; }
.mensaje-feedback { text-align: center; margin-top: 10px; color: #27ae60; font-weight: bold; }

/* Panel Derecho (Lista) */
.panel-lista { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); flex: 2; width: 100%; }
.panel-lista h2 { color: #34495e; margin-bottom: 20px; font-size: 1.2rem; }
.buscador input { width: 100%; padding: 12px; border: 1px solid #bdc3c7; border-radius: 5px; margin-bottom: 20px; font-size: 1rem; }
.sin-contactos { text-align: center; color: #95a5a6; padding: 20px; }

/* Tarjetas de contacto */
.lista-grid { display: flex; flex-direction: column; gap: 15px; }
.tarjeta-contacto { border: 1px solid #ecf0f1; padding: 15px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
.tarjeta-contacto:hover { box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-color: #bdc3c7; }
.info-principal { display: flex; align-items: center; gap: 15px; }
.info-principal h3 { margin: 0; color: #2c3e50; font-size: 1.1rem; }
.telefono { color: #7f8c8d; margin: 0; font-weight: 500; }

/* Etiquetas de colores */
.etiqueta { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: bold; }
.etiqueta.familia { background-color: #ffeaa7; color: #d35400; }
.etiqueta.amigos { background-color: #81ecec; color: #00b894; }
.etiqueta.trabajo { background-color: #fab1a0; color: #c0392b; }
.etiqueta.universidad { background-color: #a29bfe; color: #6c5ce7; }
</style>