import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDV7oF4CnK498Y06ZcQ6r0NFcmc2hEfRkU',
  authDomain: 'agendapro-b4229.firebaseapp.com',
  projectId: 'agendapro-b4229',
  storageBucket: 'agendapro-b4229.firebasestorage.app',
  messagingSenderId: '203621624656',
  appId: '1:203621624656:web:91b6be98e2c8f08d58da55'
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  useFetchStreams: false
})

export { app, auth, db }