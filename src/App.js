import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, deleteDoc, updateDoc } from "firebase/firestore";

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
  danger: "#ef4444",
  success: "#22c55e",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
  lightGray: "#e2e8f0",
  shadow: "0 4px 15px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.05)"
};

// --- ÍCONES SVG ---
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const IconCake = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M2 21h20"></path></svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
);
const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
);
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M2 9.5h20"></path></svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [animate, setAnimate] = useState(true);

  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
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

  // --- MÁSCARAS ---
  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setCepLead(value);
  };

  const handleMoneyChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = (Number(value) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setValorOrcamento(value);
  };

  const totalHighTicket = leads.filter(l => l.categoria === "HIGH TICKET").length;
  const leadsFiltrados = leads.filter(l => l.nome.toLowerCase().includes(filtroBusca.toLowerCase()));
  
  // SOMA TOTAL DOS ORÇAMENTOS
  const somaOrcamentos = leadsFiltrados.reduce((acc, curr) => {
    const val = typeof curr.valor === 'string' ? Number(curr.valor.replace(/\D/g, '')) / 100 : 0;
    return acc + val;
  }, 0);

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView !== 'novoLead') { setIdEditando(null); setNomeLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); }
      setView(newView);
      setAnimate(true);
    }, 150);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    const cepLimpo = cepLead.replace(/\D/g, '');
    setIsSaving(true);
    const nobres = ['40140','41940','40080','41810','41820','41760'];
    const categoria = nobres.includes(cepLimpo.substring(0, 5)) && parseInt(idadeLead) >= 20 ? "HIGH TICKET" : "Ticket Médio";

    try {
      const payload = { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, categoria, userId: user.uid };
      if (idEditando) {
        await updateDoc(doc(db, "leads", idEditando), payload);
      } else {
        await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      }
      navigateTo('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  const prepararEdicao = (lead) => {
    setIdEditando(lead.id); setNomeLead(lead.nome); setCepLead(lead.cep); setIdadeLead(lead.idade.toString()); setValorOrcamento(lead.valor || '');
    navigateTo('novoLead');
  };

  const removerLead = async (id) => {
    if (window.confirm("Remover este lead?")) {
      try { await deleteDoc(doc(db, "leads", id)); } catch (err) { alert("Erro."); }
    }
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif', color: theme.text, letterSpacing: '-0.2px' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(10px); transition: all 0.3s ease-out; }
        .fade-in.active { opacity: 1; transform: translateY(0); }
        input:focus { border-color: ${theme.primary} !important; outline: none; box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1); }
        .btn-action { background: none; border: none; cursor: pointer; padding: 6px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: ${theme.gray}; transition: all 0.2s ease; }
        .btn-action:hover { background: ${theme.lightGray}; color: ${theme.text}; }
        .btn-action-danger:hover { background: #fee2e2; color: ${theme.danger}; }
      `}</style>

      {user && (
        <>
          <nav style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => navigateTo('dashboard')} style={{ padding: '10px 16px', background: view === 'dashboard' ? '#fff' : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: view === 'dashboard' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>Dashboard</button>
              <button onClick={() => navigateTo('novoLead')} style={{ padding: '10px 18px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>+ Novo Lead</button>
            </div>
          </nav>

          <main style={{ padding: '30px 5%', maxWidth: 1200, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
            {view === 'dashboard' ? (
              <div>
                {/* DASHBOARD CARDS ATUALIZADOS */}
                <div style={{ display: 'flex', gap: 15, marginBottom: 30, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 180, background: '#fff', padding: 18, borderRadius: 18, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#fff7ed', padding: 10, borderRadius: 10 }}><IconUsers /></div>
                    <div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 700, textTransform: 'uppercase' }}>Leads</span><h4 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>{leads.length}</h4></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 180, background: '#fff', padding: 18, borderRadius: 18, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#fefce8', padding: 10, borderRadius: 10 }}><IconStar /></div>
                    <div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 700, textTransform: 'uppercase' }}>High Ticket</span><h4 style={{ fontSize: 20, margin: 0, fontWeight: 800 }}>{totalHighTicket}</h4></div>
                  </div>
                  <div style={{ flex: 1.5, minWidth: 220, background: '#fff', padding: 18, borderRadius: 18, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#f0fdf4', padding: 10, borderRadius: 10 }}><IconWallet /></div>
                    <div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 700, textTransform: 'uppercase' }}>Volume em Caixa</span><h4 style={{ fontSize: 20, margin: 0, fontWeight: 800, color: theme.success }}>{somaOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4></div>
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: 25 }}>
                  <IconSearch />
                  <input type="text" placeholder="Buscar pelo nome..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {leadsFiltrados.map(l => (
                    <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, border: '1px solid rgba(0,0,0,0.01)', position: 'relative' }}>
                      {l.categoria === 'HIGH TICKET' && <div style={{ position: 'absolute', top: 15, right: 15, width: 8, height: 8, borderRadius: '50%', background: theme.primary }}></div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 9, fontWeight: 800, background: l.categoria === 'HIGH TICKET' ? '#fff7ed' : '#f8fafc', color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray, padding: '4px 10px', borderRadius: 6, textTransform: 'uppercase' }}>{l.categoria}</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          <button onClick={() => prepararEdicao(l)} className="btn-action"><IconEdit /></button>
                          <button onClick={() => removerLead(l.id)} className="btn-action btn-action-danger"><IconTrash /></button>
                        </div>
                      </div>
                      <h4 style={{ margin: '14px 0 4px 0', fontSize: 18, fontWeight: 700 }}>{l.nome}</h4>
                      <p style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 700, color: theme.success }}>{l.valor || 'R$ 0,00'}</p>
                      <div style={{ display: 'flex', gap: 12, color: theme.gray, fontSize: 12, fontWeight: 500, borderTop: '1px solid #f8fafc', paddingTop: 12 }}>
                         <span style={{ display: 'flex', alignItems: 'center' }}><IconMapPin /> {l.cep}</span>
                         <span style={{ display: 'flex', alignItems: 'center' }}><IconCake /> {l.idade} anos</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: 35, borderRadius: 24, boxShadow: theme.shadow }}>
                  <h3 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>{idEditando ? "Editar Lead" : "Novo Lead"}</h3>
                  <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Nome Completo</label>
                      <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} placeholder="Ex: Maria Souza" style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                    </div>
                    
                    {/* CAMPO DE VALOR COM MÁSCARA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Orçamento Estimado (R$)</label>
                      <input value={valorOrcamento} onChange={handleMoneyChange} placeholder="R$ 0,00" style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: theme.success, fontWeight: 700 }} />
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: '65%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>CEP</label>
                        <input required value={cepLead} onChange={handleCepChange} placeholder="00000-000" style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                      <div style={{ width: '35%', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Idade</label>
                        <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                    </div>
                    <button type="submit" disabled={isSaving} style={{ marginTop: 10, padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700 }}>
                      {isSaving ? "Salvando..." : (idEditando ? "Atualizar" : "Salvar Lead")}
                    </button>
                    <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'transparent', border: 'none', color: theme.gray, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Voltar</button>
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
