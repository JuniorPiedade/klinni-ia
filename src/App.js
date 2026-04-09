import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
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

// --- NOVOS ÍCONES DE ORIGEM (SVG) ---
const IconOrigin = ({ type }) => {
  const props = { width: "16", height: "16", strokeWidth: "2", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
    case 'Site': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    default: return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
  }
};

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
);
const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M2 9.5h20"></path></svg>
);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [animate, setAnimate] = useState(true);

  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
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
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 8) v = v.slice(0, 8);
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCepLead(v);
  };

  const handleMoneyChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setValorOrcamento(v);
  };

  const leadsFiltrados = leads.filter(l => l.nome.toLowerCase().includes(filtroBusca.toLowerCase()));
  const somaOrcamentos = leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0);

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView !== 'novoLead') { setIdEditando(null); setNomeLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); setOrigemLead('Instagram'); }
      setView(newView);
      setAnimate(true);
    }, 150);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const cepLimpo = cepLead.replace(/\D/g, '');
    const nobres = ['40140','41940','40080','41810','41820','41760'];
    const categoria = nobres.includes(cepLimpo.substring(0, 5)) && parseInt(idadeLead) >= 20 ? "HIGH TICKET" : "Ticket Médio";

    try {
      const payload = { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, origem: origemLead, categoria, userId: user.uid };
      if (idEditando) { await updateDoc(doc(db, "leads", idEditando), payload); }
      else { await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() }); }
      navigateTo('dashboard');
    } catch (err) { alert("Erro."); }
    setIsSaving(false);
  };

  const prepararEdicao = (l) => {
    setIdEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep); setIdadeLead(l.idade.toString()); setValorOrcamento(l.valor || ''); setOrigemLead(l.origem || 'Instagram');
    navigateTo('novoLead');
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>Klinni IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif', color: theme.text }}>
      <style>{`.fade-in { opacity: 0; transform: translateY(10px); transition: all 0.3s ease; } .fade-in.active { opacity: 1; transform: translateY(0); } input:focus, select:focus { border-color: ${theme.primary} !important; outline: none; }`}</style>
      
      {user && (
        <>
          <nav style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
            <button onClick={() => navigateTo('novoLead')} style={{ padding: '10px 18px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>+ Novo Lead</button>
          </nav>

          <main style={{ padding: '30px 5%', maxWidth: 1200, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
            {view === 'dashboard' ? (
              <div>
                <div style={{ display: 'flex', gap: 15, marginBottom: 30, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200, background: '#fff', padding: 20, borderRadius: 18, boxShadow: theme.shadow, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 12 }}><IconWallet /></div>
                    <div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 700, textTransform: 'uppercase' }}>Volume em Caixa</span><h4 style={{ fontSize: 20, margin: 0, fontWeight: 800, color: theme.success }}>{somaOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4></div>
                  </div>
                </div>

                <div style={{ position: 'relative', marginBottom: 25 }}>
                  <IconSearch />
                  <input type="text" placeholder="Buscar pelo nome..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                  {leadsFiltrados.map(l => (
                    <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.gray, background: '#f8fafc', padding: '6px 10px', borderRadius: 8 }}>
                          <IconOrigin type={l.origem} />
                          <span style={{ fontSize: 11, fontWeight: 700 }}>{l.origem || 'Outros'}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => prepararEdicao(l)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.gray }}><IconEdit /></button>
                          <button onClick={() => { if(window.confirm("Remover?")) deleteDoc(doc(db, "leads", l.id)) }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: theme.danger }}><IconTrash /></button>
                        </div>
                      </div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: 18, fontWeight: 700 }}>{l.nome}</h4>
                      <p style={{ margin: '0 0 15px 0', fontSize: 16, fontWeight: 700, color: theme.success }}>{l.valor || 'R$ 0,00'}</p>
                      <div style={{ display: 'flex', gap: 10, fontSize: 11, fontWeight: 600, color: theme.gray, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                        <span>📍 {l.cep}</span>
                        <span>🎂 {l.idade} anos</span>
                        <span style={{ color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray }}>⭐ {l.categoria}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: 480, margin: '0 auto' }}>
                <div style={{ background: '#fff', padding: 35, borderRadius: 24, boxShadow: theme.shadow }}>
                  <h3 style={{ marginTop: 0, fontSize: 22, fontWeight: 800 }}>Cadastro de Lead</h3>
                  <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Origem do Lead</label>
                      <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontWeight: 600 }}>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Site">Site</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Nome Completo</label>
                      <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 700 }}>Orçamento Estimado</label>
                      <input value={valorOrcamento} onChange={handleMoneyChange} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', color: theme.success, fontWeight: 700 }} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>CEP</label>
                        <input required value={cepLead} onChange={handleCepChange} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 12, fontWeight: 700 }}>Idade</label>
                        <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                      </div>
                    </div>
                    <button type="submit" disabled={isSaving} style={{ padding: '15px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 700, marginTop: 10 }}>
                      {isSaving ? "Salvando..." : "Finalizar Cadastro"}
                    </button>
                    <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'transparent', border: 'none', color: theme.gray, fontWeight: 600, fontSize: 13 }}>Voltar</button>
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
