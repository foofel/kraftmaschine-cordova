import Vue from 'vue'
import VueRouter from 'vue-router'
import StartUp from '@/views/startup/StartUp.vue'
import SelectLogin from '@/views/startup/SelectLogin.vue'
import Register from '@/views/startup/Register.vue'
import AuthResult from '@/views/startup/AuthResult.vue'
import Login from '@/views/startup/Login.vue'
import Scale from '@/views/scale/Scale.vue'
import DebugView from '@/views/debug/DebugView.vue'
//import DrawerView from '@/views/drawer/DrawerView.vue'
import DrawerView from '@/views/drawer/DrawerView.vue'
import TimerMain from '@/components/hangboardtimer/TimerMain.vue'
import TimerView from '@/views/timer/TimerView.vue'
import TimerSelector from '@/components/hangboardtimer/TimerSelector.vue'
import SelectorView from '@/views/timer/SelectorView.vue'
import CalibrateView from '@/views/timer/CalibrateView.vue'
import SessionHistory from '@/components/trainhistory/SessionHistory.vue'
import BenchmarkMain from '@/components/benchmark/BenchmarkMain.vue'
//import DebugViewComponent from '@/components/debug/DebugViewComponent.vue'
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
import BluetoothConnectionSelector from '@/views/boardselector/BluetoothConnectionSelector.vue'
import { AppContext } from '@/main'
import VuePageStack from 'vue-page-stack'

// vue-router is necessary
Vue.use(VueRouter)

const routes = [
	{
		path: '/login', component: StartUp,
		children: [
			{ path: 'select', component: SelectLogin,},
			{ path: 'register', component: Register,},
			{ path: 'login', component: Login,},
			{ path: '*', redirect: 'select' } 			
		]
	},
	{
		path: '/view',
		component: DrawerView,
		meta: {
			needAuth: true
		},
		children: [
			{ path: 'scale', component: Scale },
			{ path: 'timer', component: TimerMain },
			{
				path: 'timer2', component: TimerView,
				children: [
					{ path: 'select', component: SelectorView },
					{ path: 'calibrate', component: CalibrateView },
					{ path: '*', redirect: 'select' }					
				]
			},
			{ path: 'logbook', component: SessionHistory },
			{ path: 'benchmark', component: BenchmarkMain},
			{ path: 'results', component: Highscore},
			{ path: 'profile', component: AccountOptions},
			{ path: 'profile/:id', component: ProfileView},
			{ path: 'users', component: UsersView},
			{ path: 'friends', component: FriendsView},
			{ path: 'perks', component: PerksView},
			{path: 'options', component: ConfigEditorComponent },
			{ path: 'trainplan', component: TrainPlanView},
			{ path: 'debug', component: DebugView},
			{ path: 'boardselector', component: BluetoothConnectionSelector},
			{ path: '*', redirect: 'scale' } 
		]
	},{
		path: '*', redirect: '/view/boardselector'
	} 
]

const router = new VueRouter({
	mode: 'hash',
	base: process.env.BASE_URL,
	routes
})

Vue.use(VuePageStack, { router });

router.beforeEach((to, from, next) => {
	// "/" is our init/
	const isRootNav = (from.path == "/" && to.path == "/");
	if(!isRootNav && to.path === "/") {
		next(false);
	} else {
		console.log(`+++ nav event, from: ${from.fullPath} -> ${to.fullPath}`);
		next();
	}
});

/*router.beforeEach((to, from, next) => {
	if(to.matched.some(record => record.meta.needAuth)) {
		if(!AppContext.backend.isAuthenticated()) {
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
