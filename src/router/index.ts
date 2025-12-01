import { createRouter, createWebHistory } from 'vue-router'
import CompetencyPoolView from '../views/CompetencyPoolView.vue'
import OrgTreeView from '../views/OrgTreeView.vue'
import PositionMatrixView from '../views/PositionMatrixView.vue'

const routes = [
  {
    path: '/',
    redirect: '/competencies',
  },
  {
    path: '/competencies',
    name: 'competencies',
    component: CompetencyPoolView,
  },
  {
    path: '/org',
    name: 'org',
    component: OrgTreeView,
  },
  {
    path: '/positions/:id',
    name: 'position',
    component: PositionMatrixView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
