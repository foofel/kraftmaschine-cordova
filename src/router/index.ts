import Vue from 'vue'
import VueRouter from 'vue-router'
//import SwipeView from '@/views/SwipeView.vue'
import SimpleWeight from '@/views/SimpleWeight.vue'
import StartupView from '@/views/StartupView.vue'
import DebugView from '@/views/DebugView.vue'
import DrawerView from '@/views/DrawerView.vue'
import TimerMain from '@/components/hangboardtimer/TimerMain.vue'
import SessionHistory from '@/components/trainhistory/SessionHistory.vue'
import BenchmarkMain from '@/components/benchmark/BenchmarkMain.vue'
import DebugViewComponent from '@/components/debug/DebugViewComponent.vue'
import Highscore from '@/components/highscore/Highscore.vue'
import AccountOptions from '@/components/account/AccountOptions.vue'
import FriendsView from '@/components/friends/FriendsView.vue'
import ProfileView from '@/components/profile/ProfileView.vue'
import UsersView from '@/components/users/UsersView.vue'
import PerksView from '@/components/perks/PerksView.vue'
import SimpleWeightDisplay from '@/components/SimpleWeightDisplay.vue'
import OptionsView from '@/components/options/OptionsView.vue'
import TrainPlanView from '@/components/plan/TrainPlanView.vue'
import DataEditorComponent from '@/components/DataEditorComponent.vue'
import ConfigEditorComponent from '@/components/ConfigEditorComponent.vue'
import { GlobalStore } from '@/main'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'startup',
    component: StartupView
  },
  /*{
    path: '/swipe',
    name: 'swipe',
    component: SwipeView,
    meta: {
      needAuth: true
    }
  },*/
  {
    path: '/simple',
    name: 'simple_weight',
    component: SimpleWeight
  },
  {
    path: '/debug',
    name: 'debug',
    component: DebugView
  },
  {
    path: '/view',
    name: 'view',
    component: DrawerView,
    meta: {
      needAuth: true
    },
    children: [
      {
        name: 'scale',
        path: 'scale',
        component: SimpleWeightDisplay
      },{
        name: 'scale.properties',
        path: 'scale/properties',
        props: true,
        components: {
          //default: SimpleWeightDisplay,
          overlay: DataEditorComponent
        }
      },{
        path: 'timer',
        component: TimerMain
      },{
        path: 'history',
        component: SessionHistory
      },{
        path: 'benchmark',
        component: BenchmarkMain
      },{
        path: 'highscore',
        component: Highscore
      },{
        path: 'account',
        component: AccountOptions
      },{
        path: 'profile/:id',
        component: ProfileView
      },{
        path: 'users',
        component: UsersView
      },{
        path: 'friends',
        component: FriendsView
      },{
        path: 'perks',
        component: PerksView
      },{
        path: 'board/:id',
        component: PerksView
      },{
        path: 'options',
        component: ConfigEditorComponent
      },{
        path: 'trainplan',
        component: TrainPlanView
      },{
        path: 'debug',
        component: DebugViewComponent
      }
    ]
  }
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

/*router.beforeEach((to, from, next) => {
  if(to.matched.some(record => record.meta.needAuth)) {
    if(!GlobalStore.backend.isAuthenticated()) {
      next({
        path: '/'
        //params: { nextUrl: to.fullPath }
      })
    } else {
      next();
    }
  } else {
    next();
  }  
});*/

export default router
