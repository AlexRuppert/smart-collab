import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

export const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Home',
    meta: {
      icon: 'mdi-home',
    },
    component: Home,
  },
  {
    path: '/mermaid',
    name: 'Mermaid',
    meta: {
      icon: 'mdi-view-dashboard',
    },
    component: () =>
      import(/* webpackChunkName: "mermaid" */ '../views/Mermaid.vue'),
  },
]

const router = new VueRouter({
  routes,
})

export default router
