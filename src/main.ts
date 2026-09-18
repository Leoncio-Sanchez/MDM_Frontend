import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { VueQueryPlugin } from '@tanstack/vue-query';
import App from './App.vue';
import { router } from './presentation/router';
import './index.css'; // or whatever the css file is named, let's check it: wait, it's style.css in Vite Vue template

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const app = createApp(App);
app.use(pinia);
app.use(VueQueryPlugin);
app.use(router);
app.mount('#app');
