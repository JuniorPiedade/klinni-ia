import React, { useState, useEffect } from 'react';
import { auth } from './firebase/config';
import { onAuthStateChanged } from 'firebase/auth';

// Importações "Flexíveis" - Funcionam com ou sem chaves { }
import * as LoginModule from './components/Login';
import * as RegistroModule from './components/Registro';
import * as NovoLeadFormModule from './components/NovoLeadForm';
import * as ListaLeadsModule from './components/ListaLeads';

// Ajuste para garantir que o React ache o componente certo
const Login = LoginModule.Login || LoginModule.default;
const Registro = RegistroModule.Registro || RegistroModule.default;
const NovoLeadForm = NovoLeadFormModule.NovoLeadForm || NovoLeadFormModule.default;
const ListaLeads = ListaLeadsModule.ListaLeads || ListaLeadsModule.default;

function App() {
  const [pagina, setPagina] = useState('login');
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
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

  if (carregando) return <div className="p-20 text-center font-sans text-gray-400">Iniciando Klinni IA...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F6] font-sans">
      <nav className="bg-white border-b p-4 flex justify-center gap-8 shadow-sm">
        <button onClick={() => setPagina('lista')} className="text-xs font-bold text-gray-400 hover:text-[#7FA9D1]">📋 LEADS</button>
        <button onClick={() => setPagina('novo')} className="text-xs font-bold text-gray-400 hover:text-[#7FA9D1]">➕ NOVO</button>
        <button onClick={() => auth.signOut()} className="text-xs font-bold text-red-300">SAIR</button>
      </nav>

      <main className="p-4 max-w-lg mx-auto">
        {pagina === 'login' && <Login />}
        {pagina === 'registro' && <Registro />}
        {pagina === 'lista' && <ListaLeads />}
        {pagina === 'novo' && <NovoLeadForm />}
      </main>
    </div>
  );
}

export default App;
