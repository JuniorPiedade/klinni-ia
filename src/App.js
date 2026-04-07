import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Removi as chaves { } para garantir que a Vercel encontre os arquivos
import Login from './components/Login';
import Registro from './components/Registro';
import NovoLeadForm from './components/NovoLeadForm';
import ListaLeads from './components/ListaLeads';

function App() {
  const [pagina, setPagina] = useState('login');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Monitora o login do usuário
    const monitorarUsuario = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPagina('lista'); 
      } else {
        setPagina('login');
      }
      setCarregando(false);
    });
    return () => monitorarUsuario();
  }, []);

  if (carregando) return <div className="p-20 text-center font-sans">Iniciando Klinni IA...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      {/* MENU SUPERIOR */}
      <nav className="bg-white border-b p-4 flex justify-center gap-8 shadow-sm">
        <button onClick={() => setPagina('lista')} className="text-xs font-bold text-gray-500 hover:text-[#7FA9D1]">📋 LEADS</button>
        <button onClick={() => setPagina('novo')} className="text-xs font-bold text-gray-500 hover:text-[#7FA9D1]">➕ NOVO</button>
        <button onClick={() => auth.signOut()} className="text-xs font-bold text-red-300">SAIR</button>
      </nav>

      {/* ÁREA DE CONTEÚDO */}
      <main className="p-4">
        {pagina === 'login' && <Login />}
        {pagina === 'registro' && <Registro />}
        {pagina === 'lista' && <ListaLeads />}
        {pagina === 'novo' && <NovoLeadForm />}
      </main>
    </div>
  );
}

export default App;
