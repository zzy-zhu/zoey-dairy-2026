import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Same project as the original 90-day app, so every existing entry, weekly
// summary and check-in loads straight into this one.
const firebaseConfig = {
  apiKey: 'AIzaSyAOWluk40kVAhMDN2ls32mM-mBA4iBEBds',
  authDomain: 'zoey-daily-checkin.firebaseapp.com',
  databaseURL: 'https://zoey-daily-checkin-default-rtdb.firebaseio.com',
  projectId: 'zoey-daily-checkin',
  storageBucket: 'zoey-daily-checkin.firebasestorage.app',
  messagingSenderId: '925337850992',
  appId: '1:925337850992:web:831972f69f91a055ef90b5',
  measurementId: 'G-42YCWJ073G',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

// Keeps you signed in across reloads and app restarts — including on a phone
// home-screen shortcut.
setPersistence(auth, browserLocalPersistence).catch(() => {})
