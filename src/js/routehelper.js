import Vue from 'vue'
import MyRouter from '../components/myrouter/MyRouter'

export default {
    install: (app, options) => {
        Vue.component("MyRouter", MyRouter);
        //TODO: add mixin to routes
        Vue.prototype.$myrouter = app.router;
    }
  }