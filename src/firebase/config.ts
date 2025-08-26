import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyC9WyBLpxz-uniD_TpuEaubK0SWRrOK8Fs",
  authDomain: "lablink-f9171.firebaseapp.com",
  projectId: "lablink-f9171",
  storageBucket: "lablink-f9171.firebasestorage.app",
  messagingSenderId: "418813881670",
  appId: "1:418813881670:web:fc41a75f115589bea64947"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };