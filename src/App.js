import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Importando as telas que já criamos
import { Login } from './components/Login';
import { Registro } from './components/Registro';
import { NovoLeadForm } from './components/NovoLeadForm';
import { ListaLeads } from './components/ListaLeads';
import { AdminLogs } from './components/AdminLogs';

function App() {
  const [pagina, setPagina] = useState('login');
  const [cargo, setCargo] = useState('crc'); // 'crc' é o padrão (vendedora)
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    // Monitora se alguém logou
    const monitorarUsuario = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Se logou, busca no Banco de Dados qual o CARGO desse e-mail
        const dadosUsuario = await getDoc(doc(db, "users", user.uid));
        if (dadosUsuario.exists()) {
          setCargo(dadosUsuario.data().role); // Salva se é 'admin' ou 'crc'
          setPagina('lista'); // Manda direto para a lista de leads
        }
      } else {
        setPagina('login');
      }
      setCarregando(false);
    });
    return () => monitorarUsuario();
  }, []);

  if (carregando) return <div className="p-20 text-center">Iniciando Klinni IA...</div>;

  return (
    <div className="min-h-screen bg-[#F4F7F6]">
      {/* MENU SUPERIOR INTELIGENTE */}
      <nav className="bg-white border-b p-4 flex justify-center gap-8 shadow-sm">
        <button onClick={() => setPagina('lista')} className="text-xs font-bold text-gray-500 hover:text-[#7FA9D1]">📋 LEADS</button>
        <button onClick={() => setPagina('novo')} className="text-xs font-bold text-gray-500 hover:text-[#7FA9D1]">➕ NOVO</button>
        
        {/* 🔒 AQUI ESTÁ A MÁGICA: O botão abaixo SÓ APARECE se você for o ADMIN */}
        {cargo === 'admin' && (
          <button onClick={() => setPagina('admin')} className="text-xs font-bold text-[#7FA9D1] border-b-2 border-[#7FA9D1]">
            🛡️ PAINEL DO DONO
          </button>
        )}
        
        <button onClick={() => auth.signOut()} className="text-xs font-bold text-red-300">SAIR</button>
      </nav>

      {/* TROCA DE TELAS */}
      <main className="p-4">
        {pagina === 'login' && <Login />}
        {pagina === 'registro' && <Registro />}
        {pagina === 'lista' && <ListaLeads />}
        {pagina === 'novo' && <NovoLeadForm />}
        {pagina === 'admin' && <AdminLogs />}
      </main>
    </div>
  );
}

export default App;
