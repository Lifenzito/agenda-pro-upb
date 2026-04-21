import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { useAuth } from './composables/useAuth'
import './assets/styles.css'

const app = createApp(App)
const auth = useAuth()

auth.initAuth().finally(() => {
	app.use(router).mount('#app')
})