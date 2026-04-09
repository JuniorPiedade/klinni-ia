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

// --- ÍCONES ---
const IconOrigin = ({ type }) => {
  const props = { width: "14", height: "14", strokeWidth: "2", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
    case 'Site': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    default: return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
  }
};

const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>;
const IconStar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconWallet = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M2 9.5h20"></path></svg>;

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [animate, setAnimate] = useState(true);

  // States Formulário
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
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCepLead(v);
  };

  const handleMoneyChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setValorOrcamento(v);
  };

  const leadsFiltrados = leads.filter(l => l.nome.toLowerCase().includes(filtroBusca.toLowerCase()));
  const totalHighTicket = leads.filter(l => l.categoria === "HIGH TICKET").length;
  const somaOrcamentos = leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0);

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView === 'dashboard') { setIdEditando(null); setNomeLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); }
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
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif', color: theme.text }}>
      <style>{`.fade-in { opacity: 0; transform: translateY(10px); transition: all 0.3s ease; } .fade-in.active { opacity: 1; transform: translateY(0); }`}</style>
      
      <nav style={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 5%', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigateTo('dashboard')} style={{ padding: '10px 16px', background: view === 'dashboard' ? '#fff' : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, boxShadow: view === 'dashboard' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none' }}>Dashboard</button>
          <button onClick={() => navigateTo('novoLead')} style={{ padding: '10px 18px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>+ Novo Lead</button>
        </div>
      </nav>

      <main style={{ padding: '30px 5%', maxWidth: 1100, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            {/* O FAROL VOLTOU! */}
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
                <div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 700, textTransform: 'uppercase' }}>Volume Total</span><h4 style={{ fontSize: 20, margin: 0, fontWeight: 800, color: theme.success }}>{somaOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4></div>
              </div>
            </div>

            <input type="text" placeholder="Buscar pelo nome..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 25, boxSizing: 'border-box' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {leadsFiltrados.map(l => (
                <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.gray, background: '#f8fafc', padding: '5px 10px', borderRadius: 8 }}>
                      <IconOrigin type={l.origem} /><span style={{ fontSize: 10, fontWeight: 700 }}>{l.origem || 'Outros'}</span>
                    </div>
                    <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setOrigemLead(l.origem || 'Instagram'); setView('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>Editar</button>
                  </div>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: 18 }}>{l.nome}</h4>
                  <p style={{ margin: '0 0 15px 0', fontWeight: 800, color: theme.success }}>{l.valor || 'R$ 0,00'}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: theme.gray, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <span>📍 {l.cep}</span><span>🎂 {l.idade}a</span><span style={{ color: l.categoria === 'HIGH TICKET' ? theme.primary : theme.gray }}>⭐ {l.categoria}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: 35, borderRadius: 24, boxShadow: theme.shadow }}>
              <h3 style={{ marginTop: 0 }}>{idEditando ? "Editar Lead" : "Novo Lead"}</h3>
              <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Origem</label>
                <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Site</option><option>Outros</option>
                </select>
                <label style={{ fontSize: 12, fontWeight: 700 }}>Nome Completo</label>
                <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <label style={{ fontSize: 12, fontWeight: 700 }}>Orçamento (R$)</label>
                <input value={valorOrcamento} onChange={handleMoneyChange} style={{ padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 700, color: theme.success }} />
                
                {/* IDADE DE VOLTA NO ESQUADRO */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 2 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>CEP</label>
                    <input required value={cepLead} onChange={handleCepChange} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 700 }}>Idade</label>
                    <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <button type="submit" style={{ padding: '15px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer' }}>{isSaving ? "Salvando..." : "Salvar Dados"}</button>
                <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 600 }}>Voltar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
