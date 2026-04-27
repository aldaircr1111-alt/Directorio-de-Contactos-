<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</h2>
      
      <form @submit.prevent="submitForm">
        <div class="form-group">
          <label>Usuario</label>
          <input type="text" v-model="form.username" required placeholder="Ingresa tu usuario" />
        </div>
        
        <div class="form-group" v-if="!isLogin">
          <label>Teléfono</label>
          <input type="text" v-model="form.telefono" required placeholder="Ej: 300 123 4567" />
        </div>
        
        <div class="form-group">
          <label>Contraseña</label>
          <input type="password" v-model="form.password" required placeholder="Ingresa tu contraseña" />
        </div>
        
        <button type="submit" class="btn-submit">
          {{ isLogin ? 'Ingresar' : 'Registrarse' }}
        </button>
      </form>

      <p class="toggle-text" @click="isLogin = !isLogin">
        {{ isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
      </p>
      
      <p v-if="mensaje" :class="['mensaje', tipoMensaje]">{{ mensaje }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const isLogin = ref(true);
const form = ref({ username: '', password: '', telefono: '' });
const mensaje = ref('');
const tipoMensaje = ref('');

// AQUÍ ESTÁ TU NUEVO ENLACE OFICIAL DE RENDER PARA LOGIN/REGISTRO
const API_URL = 'https://directorio-backend-bnfl.onrender.com/auth';

const submitForm = async () => {
  mensaje.value = 'Procesando...';
  tipoMensaje.value = 'info';

  try {
    if (isLogin.value) {
      const response = await axios.post(`${API_URL}/login`, {
        username: form.value.username,
        password: form.value.password
      });
      
      // Guardamos el token y los datos del usuario (incluyendo teléfono) en el store
      authStore.login(response.data.token, response.data.user);
      router.push('/directorio');
    } else {
      await axios.post(`${API_URL}/register`, form.value);
      mensaje.value = 'Registro exitoso. Ahora puedes iniciar sesión.';
      tipoMensaje.value = 'exito';
      isLogin.value = true;
      form.value = { username: '', password: '', telefono: '' }; // Limpiamos el formulario
    }
  } catch (error) {
    mensaje.value = error.response?.data?.error || 'Error en la solicitud';
    tipoMensaje.value = 'error';
  }
};
</script>

<style scoped>
/* Estilos modernos para la pantalla de inicio de sesión */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background-color: #d1d7db; /* Color de fondo estilo WhatsApp web */
  font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}

.auth-card h2 {
  text-align: center;
  margin-bottom: 25px;
  color: #111b21;
  font-weight: 500;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #3b4a54;
  font-weight: 500;
  font-size: 0.9rem;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d7db;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border 0.3s;
}

.form-group input:focus {
  border-color: #00a884;
}

.btn-submit {
  width: 100%;
  padding: 14px;
  background-color: #00a884;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.2s;
  margin-top: 10px;
}

.btn-submit:hover {
  background-color: #008f6f;
}

.toggle-text {
  text-align: center;
  margin-top: 20px;
  color: #00a884;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
}

.toggle-text:hover {
  text-decoration: underline;
}

.mensaje {
  text-align: center;
  margin-top: 15px;
  font-weight: bold;
  font-size: 0.9rem;
}

.mensaje.exito { color: #00a884; }
.mensaje.error { color: #ef4444; }
.mensaje.info { color: #667781; }
</style>