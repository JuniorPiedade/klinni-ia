import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// 1. IMPORTAÇÕES FLEXÍVEIS (Capturam qualquer formato de arquivo)
import * as LoginModule from './components/Login';
import * as RegistroModule from './components/Registro';
import * as NovoLeadModule from './components/NovoLeadForm';
import * as ListaLeadsModule from './components/ListaLeads';

// 2. TRADUTOR UNIVERSAL (Garante que o componente carregue sem erro de "Module not found")
const extrairComponente = (modulo) => {
  return modulo.default || modulo[Object.keys(modulo)[0]] || (() => null);
};

const Login = extrairComponente(LoginModule);
const Registro = extrairComponente(RegistroModule);
const NovoLeadForm = extrairComponente(NovoLeadModule);
const ListaLeads = extrairComponente(ListaLeadsModule);

function App() {
  const [pagina, setPagina] = useState('login');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Monitor de Sessão do Firebase
    const monitor = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPagina('lista');
      } else {
        setPagina('login');
      }
      setCarregando(false);
    });
    return () => monitor();
  }, []);

  if (carregando) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F4F7F6]">
        <div className="text-[#7FA9D1] font-bold animate-pulse text-lg">Iniciando Klinni IA...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      {/* MENU SUPERIOR PREMIUM */}
      <nav className="bg-white border-b border-gray-100 p-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="font-black text-[#7FA9D1] text-xl tracking-tight">KLINNI IA</div>
          <div className="flex gap-6">
            <button onClick={() => setPagina('lista')} className={`text-xs font-bold ${pagina === 'lista' ? 'text-[#7FA9D1]' : 'text-gray-400'}`}>📋 LEADS</button>
            <button onClick={() => setPagina('novo')} className={`text-xs font-bold ${pagina === 'novo' ? 'text-[#7FA9D1]' : 'text-gray-400'}`}>➕ NOVO</button>
            <button onClick={() => auth.signOut()} className="text-xs font-bold text-red-300 hover:text-red-500 uppercase">Sair</button>
          </div>
        </div>
      </nav>

      {/* RENDERIZADOR DE TELAS */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="mt-4">
          {pagina === 'login' && <Login />}
          {pagina === 'registro' && <Registro />}
          {pagina === 'lista' && <ListaLeads />}
          {pagina === 'novo' && <NovoLeadForm />}
        </div>
      </main>
    </div>
  );
}

export default App;
