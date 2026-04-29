import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase/config';
import { 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  signOut 
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para deslogar
  const logout = () => signOut(auth);

  // Função para preparar o Recaptcha invisível
  const setupRecaptcha = (containerId) => {
    return new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
    });
  };

  // Função de Login por Telefone
  const loginWithPhone = (phoneNumber, verifier) => {
    return signInWithPhoneNumber(auth, phoneNumber, verifier);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    logout,
    setupRecaptcha,
    loginWithPhone
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
