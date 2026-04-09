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
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const IconCake = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 5 }}><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M2 21h20"></path><path d="M7 8v3"></path><path d="M12 8v3"></path><path d="M17 8v3"></path></svg>
);
const IconUsers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
);
const IconStar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
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

  const handleCepChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 8) value = value.slice(0, 8);
    if (value.length > 5) value = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setCepLead(value);
  };

  const totalHighTicket = leads.filter(l => l.categoria === "HIGH TICKET").length;
  
  // LÓGICA DO FILTRO DE BUSCA
  const leadsFiltrados = leads.filter(l => 
    l.nome.toLowerCase().includes(filtroBusca.toLowerCase())
  );

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView !== 'novoLead') { setIdEditando(null); setNomeLead(''); setCepLead(''); setIdadeLead(''); }
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
      if (idEditando) {
        await updateDoc(doc(db, "leads", idEditando), { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), categoria });
      } else {
        await addDoc(collection(db, "leads"), { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), categoria, userId: user.uid, createdAt: serverTimestamp() });
      }
      navigateTo('dashboard');
    } catch (err) { alert(err.message); }
    setIsSaving(false);
  };

  const prepararEdicao = (lead) => {
    setIdEditando(lead.id); setNomeLead(lead.nome); setCepLead(lead.cep); setIdadeLead(lead.idade.toString());
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

          <main style={{ padding: '40px 5%', maxWidth: 1100, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
            {view === 'dashboard' ? (
              <div>
                <header style={{ marginBottom: 32 }}>
                  <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Gestão de Leads</h3>
                  <p style={{ color: theme.gray, marginTop: 4 }}>O desempenho da sua clínica hoje.</p>
                </header>

                <div style={{ display: 'flex', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ background: '#fff7ed', padding: 12, borderRadius: 12 }}><IconUsers /></div>
                    <div>
                      <span style={{ fontSize: 12, color: theme.gray, fontWeight: 600, textTransform: 'uppercase' }}>Total de Leads</span>
                      <h4 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>{leads.length}</h4>
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 15 }}>
                    <div style={{ background: '#fefce8', padding: 12, borderRadius: 12 }}><IconStar /></div>
                    <div>
                      <span style={{ fontSize: 12, color: theme.gray, fontWeight: 600, textTransform: 'uppercase' }}>High Ticket</span>
                      <h4 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>{totalHighTicket}</h4>
                    </div>
                  </div>
                </div>

                {/* BARRA DE BUSCA ATUALIZADA */}
                <div style={{ position: 'relative', marginBottom: 32 }}>
                  <IconSearch />
                  <input 
                    type="text" 
                    placeholder="Buscar lead pelo nome..." 
                    value={filtroBusca}
                    onChange={(e) => setFiltroBusca(e.target.value)}
                    style={{ 
                      width: '100%', 
                      padding: '16px 16px 16px 48px', 
                      borderRadius: 16, 
                      border: '1px solid #e2e8f0', 
                      background: '#fff', 
                      fontSize: 15,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                      boxSizing: 'border-box'
                    }} 
                  />
                </div>

                {leadsFiltrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, boxShadow: theme.shadow }}>
                    <div style={{ fontSize: 40, marginBottom: 15 }}>🔍</div>
                    <h4 style={{ margin: '0 0 10px 0', color: theme.text }}>Nenhum lead encontrado</h4>
                    <p style={{ color: theme.gray, fontSize: 14 }}>Tente outro nome ou cadastre um novo paciente.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                    {leadsFiltrados.map(l => (
                      <div key={l.id} style={{ padding: 24, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, border: '1px solid rgba(0,0,0,0.01)', position: 'relative', overflow: 'hidden' }}>
                        {l.categoria === 'HIGH TICKET' && <div style={{ position: 'absolute', top: 0, right: 0, width: '4px', height: '100%', background: theme.primary }}></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, background: l.categoria === 'HIGH TICKET' ? '#fff7ed' : '#f8fafc', color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray, padding: '5px 12px', borderRadius: 8, textTransform: 'uppercase' }}>{l.categoria}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => prepararEdicao(l)} className="btn-action"><IconEdit /></button>
                            <button onClick={() => removerLead(l.id)} className="btn-action btn-action-danger"><IconTrash /></button>
                          </div>
                        </div>
                        <h4 style={{ margin: '18px 0 8px 0', fontSize: 19, fontWeight: 700 }}>{l.nome}</h4>
                        <div style={{ display: 'flex', gap: 16, color: theme.gray, fontSize: 13, fontWeight: 500 }}>
                           <span style={{ display: 'flex', alignItems: 'center' }}><IconMapPin /> {l.cep}</span>
                           <span style={{ display: 'flex', alignItems: 'center' }}><IconCake /> {l.idade} anos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: 40, borderRadius: 24, boxShadow: theme.shadow }}>
                  <h3 style={{ marginTop: 0, fontSize: 24, fontWeight: 800 }}>{idEditando ? "Editar Cadastro" : "Novo Cadastro"}</h3>
                  <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 700 }}>Nome Completo</label>
                      <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} placeholder="Ex: Maria Souza" style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div style={{ width: '70%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 700 }}>CEP</label>
                        <input required value={cepLead} onChange={handleCepChange} placeholder="00000-000" style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                      <div style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 700 }}>Idade</label>
                        <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ padding: '14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc' }} />
                      </div>
                    </div>
                    <button type="submit" disabled={isSaving} style={{ padding: '16px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.3)' }}>
                      {isSaving ? "Processando..." : (idEditando ? "Atualizar Dados" : "Salvar Lead")}
                    </button>
                    <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'transparent', border: 'none', color: theme.gray, cursor: 'pointer', fontWeight: 600 }}>Cancelar</button>
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
