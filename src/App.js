import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// CONFIGURAÇÃO REAL DO KLINNI IA
const firebaseConfig = {
  apiKey: "AIzaSyBQRYB3vMi4QG___Pe9xQeNVpTJGS2hyD4",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.firebasestorage.app",
  messagingSenderId: "761229946691",
  appId: "1:761229946691:web:d538bb4f7ab6cc97be09f6",
  measurementId: "G-HKGF1J1GWP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para o formulário de NOVO LEAD
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [servicoLead, setServicoLead] = useState('');

  // Monitor de Autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setView('dashboard');
      } else {
        setView('login');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Carregar Leads em Tempo Real
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
      alert("Erro: " + err.message);
    }
  };

  const cadastrarLead = async (e) => {
    e.preventDefault();
    try {
      // Lógica de classificação automática por CEP (Regiões Nobres de Salvador)
      const bairrosNobres = ['40140', '41810', '41830', '40150', '41940']; 
      const prefixoCep = cepLead.substring(0, 5);
      const categoria = bairrosNobres.includes(prefixoCep) ? 'HIGH TICKET' : 'TICKET MÉDIO';

      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        telefone: telLead,
        cep: cepLead,
        servico: servicoLead,
        categoria: categoria,
        createdAt: serverTimestamp()
      });

      alert("Lead cadastrado com sucesso!");
      setNomeLead(''); setTelLead(''); setCepLead(''); setServicoLead('');
      setView('dashboard');
    } catch (err) {
      alert("Erro ao salvar lead: " + err.message);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-ice-gray font-inter">Carregando Sistema...</div>;

  return (
    <div className="min-h-screen bg-ice-gray font-inter text-slate-800">
      {/* NAVBAR: Só mostra opções se logado */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-blue-100">
        <h1 className="text-xl font-bold tracking-tighter text-soft-blue">KLINNI IA</h1>
        {user && (
          <div className="flex gap-6 items-center">
            <button onClick={() => setView('dashboard')} className={`text-sm font-medium ${view === 'dashboard' ? 'text-soft-blue' : 'text-slate-400'}`}>📋 GESTÃO</button>
            <button onClick={() => setView('novo')} className={`text-sm font-medium ${view === 'novo' ? 'text-soft-blue' : 'text-slate-400'}`}>➕ NOVO LEAD</button>
            <button onClick={() => signOut(auth)} className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-100 transition">SAIR</button>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        {/* VIEW: LOGIN / REGISTER */}
        {!user && (
          <div className="mt-20 max-w-md mx-auto bg-white p-8 rounded-clinic shadow-xl border border-blue-50">
            <h2 className="text-2xl font-bold text-center mb-2">{view === 'login' ? 'Acessar Conta' : 'Criar Conta'}</h2>
            <p className="text-center text-slate-400 text-sm mb-8 italic">Gestão de Leads de Alto Padrão</p>
            
            <input type="email" placeholder="E-mail" className="w-full p-4 mb-4 bg-ice-gray rounded-xl outline-none focus:ring-2 focus:ring-soft-blue" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Senha" className="w-full p-4 mb-6 bg-ice-gray rounded-xl outline-none focus:ring-2 focus:ring-soft-blue" onChange={(e) => setPassword(e.target.value)} />
            
            <button onClick={() => handleAuth(view)} className="w-full py-4 bg-gradient-to-r from-soft-blue to-deep-blue text-white rounded-xl font-bold shadow-lg transform active:scale-95 transition">
              {view === 'login' ? 'ENTRAR' : 'CRIAR MINHA CONTA'}
            </button>

            <button onClick={() => setView(view === 'login' ? 'register' : 'login')} className="w-full mt-6 text-sm text-soft-blue font-medium underline">
              {view === 'login' ? 'Não tem conta? Cadastre-se' : 'Já sou cadastrado. Entrar'}
            </button>
          </div>
        )}

        {/* VIEW: GESTÃO (DASHBOARD) */}
        {user && view === 'dashboard' && (
          <div>
            <div className="flex justify-between items-end mb-8">
              <div>
                <h2 className="text-3xl font-bold text-slate-800">Gestão de Oportunidades</h2>
                <p className="text-slate-500">Seus potenciais clientes em tempo real.</p>
              </div>
              <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-50 text-sm font-bold text-soft-blue">
                {leads.length} Leads
              </div>
            </div>

            <div className="grid gap-4">
              {leads.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-clinic border-2 border-dashed border-blue-100 text-slate-400">
                  Nenhum lead encontrado.
                </div>
