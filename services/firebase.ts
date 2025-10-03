
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Tu configuración de la aplicación web de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBFkVTdWYrN4lxDLRLJalUSBpxoONqdYk0",
  authDomain: "checklist-departamento.firebaseapp.com",
  projectId: "checklist-departamento",
  storageBucket: "checklist-departamento.firebasestorage.app",
  messagingSenderId: "615469691845",
  appId: "1:615469691845:web:27c56ecd5d0a3df3b851ac"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Cloud Firestore y obtener una referencia al servicio
const db = getFirestore(app);

export { db };
