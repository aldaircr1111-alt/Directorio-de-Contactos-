import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  // Estado: Leemos el token del navegador al cargar la página
  const token = ref(localStorage.getItem('token') || '')

  // Acción: Guardar el token al iniciar sesión
  const login = (nuevoToken) => {
    token.value = nuevoToken
    localStorage.setItem('token', nuevoToken)
  }

  // Acción: Borrar el token al cerrar sesión
  const logout = () => {
    token.value = ''
    localStorage.removeItem('token')
  }

  // Retornamos lo que queremos que otras pantallas puedan usar
  return { token, login, logout }
})