import React, { useState, useEffect } from 'react';
import { auth } from './lib/firebase'; // Certifique-se de que o caminho está correto
import { onAuthStateChanged } from 'firebase/auth';

// Componentes (Importe os seus aqui)
import Login from './components/auth/Login';
import DashboardKlinni from './components/dashboard/DashboardKlinni';
import Sidebar from './components/layout/Sidebar';
import LoadingScreen from './components/ui/LoadingScreen';

// Estilos
import './styles/globals.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Observer de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Tela de carregamento premium (Skeleton ou Logo Fade)
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Se o usuário estiver logado, renderiza a estrutura interna */}
      {user ? (
        <>
          <Sidebar user={user} />
          <div className="flex-1 flex flex-col">
            {/* O Dashboard ou as rotas internas entram aqui */}
            <DashboardKlinni user={user} />
          </div>
        </>
      ) : (
        /* Caso contrário, renderiza a tela de login minimalista */
        <div className="w-full h-full flex items-center justify-center">
          <Login />
        </div>
      )}
    </div>
  );
}

export default App;
