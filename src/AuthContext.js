import React, { createContext, useContext, useEffect, useState } from 'react';
// Caminho ajustado: ele entra na pasta firebase e busca o config.js
import { auth } from './firebase/config'; 
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função de Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Função de Cadastro
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  // Função Esqueci a Senha
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }

  // Função Logout
  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, resetPassword }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
