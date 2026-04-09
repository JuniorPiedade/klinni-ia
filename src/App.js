import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const theme = {
  primary: "#f97316", // Laranja principal
  primaryHover: "#ea580c",
  bg: "#f8fafc",
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);

  // Estados do Form
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
    });
  }, [user]);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, "teste@teste.com", "123456");
    } catch (err) {
      alert("Erro ao logar. Verifique se o usuário teste@teste.com existe no Firebase.");
    }
    setLoginLoading(false);
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    const idade = parseInt(idadeLead);
    const cepLimpo = cepLead.replace(/\D/g, '');

    if (!nomeLead || !cepLead || isNaN(idade)) {
      alert("Preencha todos os campos corretamente.");
      return;
    }

    setIsSaving(true);
    const nobres = ['40140','41940','40080','41810','41820','41760'];
    const categoria = nobres.includes(cepLimpo.substring(0, 5)) && idade >= 20
        ? "HIGH TICKET"
        : "Ticket Médio";

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        cep: cepLimpo,
        idade,
        categoria,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      setView('dashboard');
    } catch (err) {
      alert(err.message);
    }
    setIsSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: 'system-ui, sans-serif' }}>
      {!user ? (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: theme.text, letterSpacing: '-1px' }}>KLINNI<span style={{ color: theme.primary }}>IA</span></h1>
          <button onClick={handleLogin} disabled={loginLoading} style={{ padding: '14px 40px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 600, fontSize: 16, boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.2)' }}>
            {loginLoading ? "Entrando..." : "Acessar Painel"}
          </button>
        </div>
      ) : (
        <>
          {/* TOPO DO APP ESTILIZADO */}
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: '#fff', borderBottom: '1px solid #e2e8f0', sticky: 'top' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: theme.text, margin: 0 }}>KLINNI<span style={{ color: theme.primary }}>IA</span></h2>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setView('dashboard')} 
                style={{ padding: '10px 18px', background: view === 'dashboard' ? '#fff7ed' : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Dashboard
              </button>
              <button 
                onClick={() => setView('novoLead')} 
                style={{ padding: '10px 20px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, boxShadow: '0 2px 4px rgba(249, 115, 22, 0.3)' }}>
                + Novo Lead
              </button>
            </div>
          </nav>

          <main style={{ padding: '40px 5%', maxWidth: 1000, margin: '0 auto' }}>
            {view === 'dashboard' ? (
              <div>
                <div style={{ marginBottom: 25 }}>
                  <h3 style={{ margin: 0, fontSize: 24 }}>Seus Leads</h3>
                  <p style={{ color: theme.gray, margin: '5px 0' }}>Gerencie os leads capturados para suas clínicas.</p>
                </div>

                {leads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 60, background: '#fff', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                    <p style={{ color: theme.gray }}>Nenhum lead cadastrado ainda. Clique em "+ Novo Lead" para começar!</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {leads.map(l => (
                      <div key={l.id} style={{ padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: l.categoria === 'HIGH TICKET' ? `1px solid ${theme.primary}` : '1px solid #f1f5f9', position: 'relative' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, background: l.categoria === 'HIGH TICKET' ? '#ffedd5' : '#f1f5f9', color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase' }}>
                          {l.categoria}
                        </span>
                        <h4 style={{ margin: '15px 0 5px 0', fontSize: 18 }}>{l.nome}</h4>
                        <p style={{ margin: 0, color: theme.gray, fontSize: 14 }}>CEP: {l.cep} • Idade: {l.idade} anos</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: '#fff', padding: 40, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: 500, margin: '0 auto' }}>
                <h3 style={{ marginTop: 0, fontSize: 22 }}>Novo Lead</h3>
                <form onSubmit={handleNovoLead} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={{ fontSize: 14, fontWeight: 600, color: theme.gray }}>Nome do Paciente</label>
                    <input value={nomeLead} onChange={e=>setNomeLead(e.target.value)} placeholder="Ex: João Silva" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', outlineColor: theme.primary }} />
                  </div>
                  
                  <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 2 }}>
                      <label style={{ fontSize: 14, fontWeight: 600, color: theme.gray }}>CEP</label>
                      <input value={cepLead} onChange={e=>setCepLead(e.target.value)} placeholder="40000-000" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', outlineColor: theme.primary }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      <label style={{ fontSize: 14, fontWeight: 600, color: theme.gray }}>Idade</label>
                      <input type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} placeholder="00" style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid #cbd5e1', outlineColor: theme.primary }} />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} style={{ marginTop: 10, padding: 15, background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
                    {isSaving ? "Cadastrando..." : "Confirmar Cadastro"}
                  </button>
                  <button type="button" onClick={() => setView('dashboard')} style={{ background: 'transparent', border: 'none', color: theme.gray, cursor: 'pointer', fontWeight: 500 }}>Voltar</button>
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
