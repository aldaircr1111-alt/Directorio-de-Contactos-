import { createRouter, createWebHistory } from 'vue-router'
import AuthView from '../views/AuthView.vue'
import DirectorioView from '../views/DirectorioView.vue'

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
      // Esta meta-etiqueta indica que la ruta es privada
      meta: { requiresAuth: true }
    }
  ]
})

// === EL GUARDIA DE NAVEGACIÓN (Navigation Guard) ===
router.beforeEach((to, from, next) => {
  // Verificamos si el usuario tiene el token guardado
  const isAuthenticated = localStorage.getItem('token');

  // Si intenta ir a una ruta que requiere autenticación y NO tiene token...
  if (to.meta.requiresAuth && !isAuthenticated) {
    // Lo devolvemos a la pantalla de login
    next('/');
  } else {
    // Si todo está bien, lo dejamos pasar
    next();
  }
})

export default router