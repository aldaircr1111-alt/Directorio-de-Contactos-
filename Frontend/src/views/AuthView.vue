<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1 class="titulo">Directorio de Contactos</h1>
      
      <div class="form-wrapper">
        <h2>{{ esLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</h2>
        
        <form @submit.prevent="procesarFormulario">
          <div class="grupo-input">
            <label>Usuario:</label>
            <input type="text" v-model="username" required placeholder="Escribe tu usuario" />
          </div>
          
          <div class="grupo-input" v-if="!esLogin">
            <label>Teléfono:</label>
            <input type="text" v-model="telefono" required placeholder="Ej: 3001234567" />
          </div>

          <div class="grupo-input">
            <label>Contraseña:</label>
            <input type="password" v-model="password" required placeholder="Mínimo 6 caracteres" />
          </div>
          
          <button type="submit" class="btn-principal">
            {{ esLogin ? 'Ingresar al Directorio' : 'Registrarme' }}
          </button>
        </form>

        <p class="cambiar-modo">
          <a href="#" @click.prevent="esLogin = !esLogin">
            {{ esLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
          </a>
        </p>

        <p v-if="mensaje" :class="['mensaje-feedback', tipoMensaje]">{{ mensaje }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const esLogin = ref(true);
const username = ref('');
const password = ref('');
const telefono = ref(''); 
const mensaje = ref('');
const tipoMensaje = ref('');

const procesarFormulario = async () => {
  const url = esLogin.value 
    ? 'https://directorio-de-contactos-backend.onrender.com/login' 
    : 'https://directorio-de-contactos-backend.onrender.com/register';
  
  mensaje.value = 'Procesando...';
  tipoMensaje.value = '';

  try {
    const datosAEnviar = esLogin.value 
      ? { username: username.value, password: password.value }
      : { username: username.value, password: password.value, telefono: telefono.value };

    const respuesta = await axios.post(url, datosAEnviar);

    if (esLogin.value) {
      // AQUÍ ENVIAMOS AMBAS COSAS A LA MEMORIA (auth.js)
      authStore.login(respuesta.data.token, respuesta.data.user);
      
      mensaje.value = '¡Inicio de sesión exitoso! Redirigiendo...';
      tipoMensaje.value = 'exito';
      setTimeout(() => router.push('/directorio'), 1000);
    } else {
      mensaje.value = '¡Usuario creado con éxito! Ahora puedes iniciar sesión.';
      tipoMensaje.value = 'exito';
      esLogin.value = true;
      password.value = '';
      telefono.value = ''; 
    }
  } catch (error) {
    const errorDelServidor = error.response?.data?.error || error.response?.data || 'Ocurrió un error inesperado';
    mensaje.value = `Error: ${errorDelServidor}`;
    tipoMensaje.value = 'error';
  }
};
</script>

<style scoped>
.auth-container { min-height: 100vh; display: flex; justify-content: center; align-items: center; background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
.auth-card { background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; text-align: center; }
.titulo { color: #2c3e50; font-size: 1.8rem; margin-bottom: 30px; }
h2 { color: #34495e; font-size: 1.3rem; margin-bottom: 20px; }
.grupo-input { margin-bottom: 15px; text-align: left; }
.grupo-input label { display: block; margin-bottom: 5px; color: #7f8c8d; font-size: 0.9rem; }
.grupo-input input { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; outline: none; transition: border-color 0.3s; }
.grupo-input input:focus { border-color: #3498db; }
.btn-principal { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 5px; font-weight: bold; cursor: pointer; transition: background-color 0.3s; margin-top: 10px; }
.btn-principal:hover { background-color: #2980b9; }
.cambiar-modo { margin-top: 20px; font-size: 0.9rem; }
.cambiar-modo a { color: #3498db; text-decoration: none; }
.cambiar-modo a:hover { text-decoration: underline; }
.mensaje-feedback { margin-top: 15px; padding: 10px; border-radius: 5px; font-size: 0.9rem; font-weight: bold; }
.mensaje-feedback.exito { background-color: #e8f8f5; color: #27ae60; }
.mensaje-feedback.error { background-color: #fdedec; color: #c0392b; }
</style>