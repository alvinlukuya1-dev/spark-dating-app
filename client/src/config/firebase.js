import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyDxRdYG9yH91_mGAC5sK1JmmeSS2vaOLwQ',
  authDomain: 'pwani-sparks.firebaseapp.com',
  projectId: 'pwani-sparks',
  storageBucket: 'pwani-sparks.firebasestorage.app',
  messagingSenderId: '999016305480',
  appId: '1:999016305480:web:1a442adcabcc6eb56a597d',
  measurementId: 'G-1RM7SYD81D'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
