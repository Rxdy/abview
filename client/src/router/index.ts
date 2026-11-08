import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import EditeurView from '../views/EditeurView.vue'
import ApercuView from '../views/ApercuView.vue'
import VeilleView from '../views/VeilleView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/editeur',
      name: 'editeur',
      component: EditeurView,
    },
    {
      path: '/apercu',
      name: 'apercu',
      component: ApercuView,
    },
    {
      path: '/veille',
      name: 'veille',
      component: VeilleView,
    },
  ],
})

export default router
