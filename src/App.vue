<template>
	<div id="app" class="">
		<router-view/>
	</div>
</template>

<script>
import Vue from 'vue'
import VueAxios from 'vue-axios'
import VueAuthenticate from 'vue-authenticate'
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
</style>