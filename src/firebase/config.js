import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Essas são as credenciais do seu banco de dados
const firebaseConfig = {
  apiKey: "AIzaSy...", // Não se preocupe, depois a gente coloca a sua real aqui
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Inicia o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as ferramentas para o resto do sistema usar
export const auth = getAuth(app);
export const db = getFirestore(app);
