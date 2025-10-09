import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFkVTdWYrN4lxDLRLJalUSBpxoONqdYk0",
  authDomain: "checklist-departamento.firebaseapp.com",
  projectId: "checklist-departamento",
  storageBucket: "checklist-departamento.firebasestorage.app",
  messagingSenderId: "615469691845",
  appId: "1:615469691845:web:27c56ecd5d0a3df3b851ac"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);