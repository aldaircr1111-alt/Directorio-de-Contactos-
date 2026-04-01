<template>
  <div class="contenedor-principal">
    <h1>Directorio de Contactos</h1>

    <div class="caja-formulario">
      <h2>{{ esLogin ? 'Iniciar Sesión' : 'Registrar Nuevo Usuario' }}</h2>

      <form @submit.prevent="procesarFormulario">
        <div class="grupo-input">
          <label>Usuario:</label>
          <input type="text" v-model="username" placeholder="Escribe tu usuario" required />
        </div>
        
        <div class="grupo-input">
          <label>Contraseña:</label>
          <input type="password" v-model="password" placeholder="Mínimo 6 caracteres" required />
        </div>

        <button type="submit" class="btn-principal">
          {{ esLogin ? 'Ingresar al Directorio' : 'Crear mi Cuenta' }}
        </button>
      </form>

      <p class="texto-alternar" @click="esLogin = !esLogin">
        {{ esLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión aquí' }}
      </p>

      <p v-if="mensaje" :class="['mensaje', tipoMensaje]">{{ mensaje }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

// Variables reactivas
const esLogin = ref(true); // Controla si mostramos el login o el registro
const username = ref('');
const password = ref('');
const mensaje = ref('');
const tipoMensaje = ref(''); // 'exito' o 'error'

const procesarFormulario = async () => {
  // Elegir la URL dependiendo de en qué pantalla estemos
  const url = esLogin.value ? 'http://localhost:3000/login' : 'http://localhost:3000/register';
  
  mensaje.value = 'Procesando...';
  tipoMensaje.value = '';

  try {
    const respuesta = await axios.post(url, {
      username: username.value,
      password: password.value
    });

    if (esLogin.value) {
      // Si es login, guardamos el token
      localStorage.setItem('token', respuesta.data.token);
      mensaje.value = '¡Inicio de sesión exitoso! Token guardado.';
      tipoMensaje.value = 'exito';
    } else {
      // Si es registro
      mensaje.value = '¡Usuario creado con éxito! Ahora puedes iniciar sesión.';
      tipoMensaje.value = 'exito';
      esLogin.value = true; // Pasamos a la pantalla de login automáticamente
      password.value = ''; // Limpiamos la contraseña por seguridad
    }
  } catch (error) {
    // Si hay error (como contraseñas cortas por Zod, o usuario repetido)
    const errorDelServidor = error.response?.data?.errores?.[0]?.message || error.response?.data || 'Ocurrió un error inesperado';
    mensaje.value = `Error: ${errorDelServidor}`;
    tipoMensaje.value = 'error';
  }
};
</script>

<style>
/* Reset básico */
* { box-sizing: border-box; margin: 0; padding: 0; }

body { background-color: #f4f7f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

.contenedor-principal { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
h1 { color: #2c3e50; margin-bottom: 30px; text-align: center; }

.caja-formulario { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
h2 { text-align: center; color: #34495e; margin-bottom: 20px; font-size: 1.5rem; }

.grupo-input { margin-bottom: 15px; }
.grupo-input label { display: block; margin-bottom: 5px; color: #7f8c8d; font-weight: 500; }
.grupo-input input { width: 100%; padding: 10px; border: 1px solid #bdc3c7; border-radius: 5px; outline: none; transition: border-color 0.3s; }
.grupo-input input:focus { border-color: #3498db; }

.btn-principal { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 5px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background-color 0.3s; }
.btn-principal:hover { background-color: #2980b9; }

.texto-alternar { text-align: center; margin-top: 15px; color: #3498db; cursor: pointer; font-size: 0.9rem; text-decoration: underline; }
.texto-alternar:hover { color: #2980b9; }

.mensaje { margin-top: 20px; padding: 10px; border-radius: 5px; text-align: center; font-weight: 500; font-size: 0.9rem; }
.mensaje.exito { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.mensaje.error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
</style>