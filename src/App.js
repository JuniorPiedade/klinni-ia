import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy } from "firebase/firestore";

// CONFIGURAÇÃO FIREBASE (Mantenha as suas chaves aqui)
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-id",
  appId: "seu-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login, register, dashboard, novo
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Monitor de Autenticação (Resolve o Erro 1)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setView('dashboard'); // Se logar, vai direto para Gestão
      } else {
        setView('login'); // Se não, volta para Home/Login
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Carregar Leads (Resolve o Erro 3)
  useEffect(() => {
    if (user) {
      const q = query(collection(db, "leads"), orderBy("createdAt", "desc"));
      const unsubLeads = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLeads(list);
      });
      return () => unsubLeads();
    }
  }, [user]);

  const handleAuth = async (type) => {
    try {
      if (type === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert("Erro na autenticação: " + err.message);
    }
  };

  const logout = () => signOut(auth);

  if (loading) return <div className="h-screen flex items-center justify-center bg-ice-gray">Carregando...</div>;

  return (
    <div className="min-h-screen bg-ice-gray font-inter text-slate-800">
      {/* NAVBAR DINÂMICA (Resolve o Erro 2) */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-blue-100">
        <h1 className="text-xl font-bold tracking-tighter text-soft-blue">KLINNI IA</h1>
        {user && (
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('dashboard')} className={`text-sm font-medium ${view === 'dashboard' ? 'text-soft-blue' : ''}`}>📋 GESTÃO</button>
            <button onClick={() => setView('novo')} className={`text-sm font-medium ${view === 'novo' ? 'text-soft-blue' : ''}`}>➕ NOVO LEAD</button>
            <button onClick={logout} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 transition">SAIR</button>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {/* VIEW: LOGIN & REGISTER (Home Limpa) */}
        {!user && (
          <div className="mt-20 max-w-md mx-auto bg-white p-8 rounded-clinic shadow-xl border border-blue-50">
            <h2 className="text-2xl font-bold text-center mb-2">{view === 'login' ? 'Acessar Conta' : 'Criar Conta'}</h2>
            <p className="text-center text-slate-400 text-sm mb-8">Sistemas de Gestão de Alto Padrão</p>
            
            <input type="email" placeholder="E-mail Profissional" className="w-full p-4 mb-4 bg-ice-gray rounded-xl border-none focus:ring-2 focus:ring-soft-blue outline-none" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full p-4 mb-6 bg-ice-gray rounded-xl border-none focus:ring-2 focus:ring-soft-blue outline-none" onChange={(e) => setPassword(e.target.value)} />
            
            <button onClick={() => handleAuth(view)} className="w-full py-4 bg-gradient-to-r from-soft-blue to-deep-blue text-white rounded-xl font-bold shadow-lg hover:opacity-90 transition transform active:scale-95">
              {view === 'login' ? 'ENTRAR NO SISTEMA' : 'FINALIZAR CADASTRO'}
            </button>

            <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full mt-6 text-sm text-soft-blue font-medium underline">
              {view === 'login' ? 'Não tem conta? Criar agora' : 'Já tenho conta. Fazer Login'}
            </button>
          </div>
        )}

        {/* VIEW: GESTÃO DE OPORTUNIDADES (Página de Leads) */}
        {user && view === 'dashboard' && (
          <div>
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800">Gestão de Oportunidades</h2>
              <p className="text-slate-500">Acompanhe seus leads de alto valor em tempo real.</p>
            </header>

            <div className="grid gap-4">
              {leads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-clinic border-2 border-dashed border-blue-100">
                  <p className="text-slate-400">Nenhum lead cadastrado. Clique em "NOVO LEAD" para começar.</p>
                </div>
              ) : (
                leads.map(lead => (
                  <div key={lead.id} className="bg-white p-6 rounded-clinic shadow-sm border-l-8 border-soft-blue flex justify-between items-center hover:shadow-md transition">
                    <div>
                      <h3 className="font-bold text-lg">{lead.nome}</h3>
                      <p className="text-sm text-slate-500">{lead.email} • {lead.telefone}</p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${lead.categoria === 'HIGH TICKET' ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-500'}`}>
                        {lead.categoria}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Bairro: {lead.bairro}</p>
                      <p className="text-xs font-bold text-soft-blue mt-1 italic">{lead.servico}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* VIEW: NOVO LEAD (Fomulário) */}
        {user && view === 'novo' && (
           <div className="bg-white p-8 rounded-clinic shadow-lg">
             <h2 className="text-2xl font-bold mb-6 italic">Cadastrar Novo Paciente/Lead</h2>
             {/* Aqui iria o formulário de cadastro de leads que já fizemos */}
             <p className="text-slate-400 italic">Formulário de cadastro em processamento...</p>
             <button onClick={() => setView('dashboard')} className="mt-4 text-soft-blue underline">Voltar para Gestão</button>
           </div>
        )}
      </main>

      {/* RODAPÉ */}
      <footer className="fixed bottom-4 left-0 w-full text-center text-[10px] text-slate-400 uppercase tracking-[3px]">
        Dr. Leonardo • Tecnologia & Conforto
      </footer>
    </div>
  );
}

export default App;
