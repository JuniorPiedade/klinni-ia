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
  primary: "#f97316",
  primaryHover: "#ea580c",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
  shadow: "0 4px 15px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.05)"
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [animate, setAnimate] = useState(true);

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
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
    });
  }, [user]);

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      setView(newView);
      setAnimate(true);
    }, 150);
  };

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, "teste@teste.com", "123456");
    } catch (err) { alert("Erro ao acessar."); }
    setLoginLoading(false);
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    const cepLimpo = cepLead.replace(/\D/g, '');
    setIsSaving(true);
    const nobres = ['40140','41940','40080','41810','41820','41760'];
    const categoria = nobres.includes(cepLimpo.substring(0, 5)) && parseInt(idadeLead) >= 20 ? "HIGH TICKET" : "Ticket Médio";

    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLimpo, idade: parseInt(idadeLead), categoria, userId: user.uid, createdAt: serverTimestamp()
      });
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      navigateTo('dashboard');
    } catch (err) { alert(err.message); }
    setIsSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif', color: theme.text }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(10px); transition: all 0.3s ease-out; }
        .fade-in.active { opacity: 1; transform: translateY(0); }
        input:focus { border-color: ${theme.primary} !important; outline: none; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
        button { transition: all 0.2s ease; }
        button:hover { transform: translateY(-1px); filter: brightness(1.1); }
        button:active { transform: translateY(0px); }
        /* Estilo para inputs ficarem enquadrados */
        input { box-sizing: border-box; width: 100%; }
      `}</style>

      {!user ? (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ padding: 40, background: '#fff', borderRadius: 24, boxShadow: theme.shadow }}>
             <h1 style={{ fontSize: 36, fontWeight: 900, margin: '0 0 10px 0' }}>KLINNI<span style={{ color: theme.primary }}>IA</span></h1>
             <p style={{ color: theme.gray, marginBottom: 30 }}>Marketing inteligente para clínicas.</p>
             <button onClick={handleLogin} disabled={loginLoading} style={{ padding: '16px 48px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>
               {loginLoading ? "Verificando..." : "Entrar agora"}
             </button>
          </div>
        </div>
      ) : (
        <>
          <nav style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI<span style={{ color: theme.primary }}>IA</span></h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigateTo('dashboard')} style={{ padding: '10px 16px', background: view === 'dashboard' ? '#fff' : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: view === 'dashboard' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>Dashboard</button>
              <button onClick={() => navigateTo('novoLead')} style={{ padding: '10px 18px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>+ Novo Lead</button>
            </div>
          </nav>

          <main style={{ padding: '40px 5%', maxWidth: 1100, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
            {view === 'dashboard' ? (
              <div>
                <header style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Gestão de Leads</h3>
                  <p style={{ color: theme.gray }}>Acompanhe em tempo real as oportunidades de hoje.</p>
                </header>

                {leads.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, boxShadow: theme.shadow }}>
                    <div style={{ fontSize: 50, marginBottom: 20 }}>🚀</div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: 20 }}>Tudo pronto para começar?</h4>
                    <p style={{ color: theme.gray, maxWidth: 350, margin: '0 auto 25px' }}>Sua base de dados está vazia. Comece cadastrando os interessados da Tavares Odontologia ou Glamour Depil.</p>
                    <button onClick={() => navigateTo('novoLead')} style={{ padding: '12px 24px', background: '#fef2e8', color: theme.primary, border: `1px solid ${theme.primary}`, borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Cadastrar primeiro lead</button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {leads.map(l => (
                      <div key={l.id} style={{ padding: 24, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, border: '1px solid rgba(0,0,0,0.02)', position: 'relative', overflow: 'hidden' }}>
                        {l.categoria === 'HIGH TICKET' && <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: theme.primary }}></div>}
                        <span style={{ fontSize: 10, fontWeight: 800, background: l.categoria === 'HIGH TICKET' ? '#fff7ed' : '#f8fafc', color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray, padding: '5px 12px', borderRadius: 8, textTransform: 'uppercase', border: '1px solid rgba(0,0,0,0.03)' }}>{l.categoria}</span>
                        <h4 style={{ margin: '16px 0 6px 0', fontSize: 19, letterSpacing: '-0.5px' }}>{l.nome}</h4>
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: theme.gray, fontSize: 13 }}>
                           <span>📍 CEP: {l.cep}</span>
                           <span>🎂 {l.idade} anos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: theme.shadow }}>
                  <h3 style={{ marginTop: 0, fontSize: 24, fontWeight: 800 }}>Novo Cadastro</h3>
                  <p style={{ color: theme.gray, marginBottom: 30, fontSize: 14 }}>Insira os dados do paciente para classificação automática.</p>
                  
                  <form onSubmit={handleNovoLead} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Nome Completo</label>
                      <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} placeholder="Ex: Maria Souza" style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                    </div>
                    
                    {/* CONTAINER AJUSTADO E ENQUADRADO */}
                    <div style={{ display: 'flex', gap: 16, width: '100%' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '70%' }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>CEP</label>
                        <input required value={cepLead} onChange={e=>setCepLead(e.target.value)} placeholder="40000-000" style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '30%' }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>Idade</label>
                        <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} placeholder="Ex: 30" style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                    </div>

                    <button type="submit" disabled={isSaving} style={{ marginTop: 10, padding: '16px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 16, boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' }}>
                      {isSaving ? "Processando..." : "Salvar Lead"}
                    </button>
                    <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'transparent', border: 'none', color: theme.gray, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Cancelar e voltar</button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
