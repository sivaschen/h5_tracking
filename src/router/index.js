import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
const Location = () => import(/* webpackChunkName: "location" */ '../views/Location.vue');
const Test = () => import(/* webpackChunkName: "location" */ '../views/Maptest.vue');

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    component: Location
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  },
  {
    path: '/playback',
    name: 'Playback',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/Playback.vue')
  },
  {
    path: '/location',
    name: 'Location',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: Location
  }
  ,
  {
    path: '/test',
    name: 'Test',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: Test
  }
  
]

const router = new VueRouter({
  routes
})

export default router
