import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase/config'; 
import { 
  createUserWithEmailAndPassword, 
  onAuthStateChanged 
} from 'firebase/auth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function signup(email, password) {
    if (!auth) return Promise.reject("Firebase Auth não inicializado");
    return createUserWithEmailAndPassword(auth, email, password);
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, signup }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
