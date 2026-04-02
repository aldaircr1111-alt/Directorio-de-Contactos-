import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import DirectorioView from '../views/DirectorioView.vue'
import { useAuthStore } from '../stores/auth' // 1. Importamos Pinia

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'auth',
      component: AuthView
    },
    {
      path: '/directorio',
      name: 'directorio',
      component: DirectorioView,
      meta: { requiresAuth: true }
    }
  ]
})

// === EL GUARDIA DE NAVEGACIÓN ===
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore() // 2. Consultamos la bóveda de Pinia
  const isAuthenticated = authStore.token

  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router