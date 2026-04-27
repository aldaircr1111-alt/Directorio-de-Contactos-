import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado: Leemos el token y el usuario del navegador al cargar la página
  const token = ref(localStorage.getItem('token') || '')
  // Usamos try-catch por seguridad, por si hay basura en la memoria
  let usuarioGuardado = null;
  try {
    usuarioGuardado = JSON.parse(localStorage.getItem('user'));
  } catch (e) {
    usuarioGuardado = null;
  }
  const user = ref(usuarioGuardado)

  // Acción: Guardar el token y el usuario al iniciar sesión
  const login = (nuevoToken, datosUsuario) => {
    token.value = nuevoToken
    user.value = datosUsuario
    
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('user', JSON.stringify(datosUsuario))
  }

  // Acción: Borrar el token y el usuario al cerrar sesión
  const logout = () => {
    token.value = ''
    user.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  // Retornamos el user también para que las pantallas puedan usarlo
  return { token, user, login, logout }
})