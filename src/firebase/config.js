import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Credenciais conectadas ao projeto Klinni IA
const firebaseConfig = {
  apiKey: "AIzaSy...", 
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as funções para serem usadas no AuthContext.js e outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
