<template>
	<div id="app" class="">
		<router-view/>
		<notifications classes="my-notification" position="bottom center"/>
	</div>
</template>

<script>
import Vue from 'vue'
import VueAxios from 'vue-axios'
import VueAuthenticate from 'vue-authenticate'
import Notifications from 'vue-notification'
import axios from 'axios';

Vue.use(VueAxios, axios)
Vue.use(VueAuthenticate, {
	baseUrl: 'https://192.168.1.20/api', // <-- UNUSED (with token based login only used for oauth code)
	providers: {
		facebook: {
			responseType: 'token',
			clientId: '311272643683412',
			redirectUri: 'https://192.168.1.20:8880/#/login/auth/facebook/callback' // <> Your client app URL
		}
	}
})
Vue.use(Notifications)
export default {}
</script>

<style lang="scss">
@import './assets/fonts/fonts.css';
@import './assets/fontawesome/css/all.css';
@import './assets/styles/globals.scss';
#app {
	font-family: 'Roboto';
	width: 100vw;
	height: 100vh;
}
.my-notification {
  // styling
  margin: 0 5px 5px;
  padding: 10px;
  font-size: 12px;
  color: #ffffff;
  
  // default (blue)
  background: #44A4FC;
  border-left: 5px solid #187FE7;

  // types (green, amber, red)
  &.success {
    background: #68CD86;
    border-left-color: #42A85F;
  }

  &.warn {
    background: #ffb648;
    border-left-color: #f48a06;
  }

  &.error {
    background: #E54D42;
    border-left-color: #B82E24;
  }
}
</style>