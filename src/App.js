import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc } from "firebase/firestore";

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
  info: "#3b82f6",
  bg: "#f1f5f9",
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
  lightGray: "#e2e8f0",
  shadow: "0 4px 15px -3px rgba(0, 0, 0, 0.07), 0 2px 6px -2px rgba(0, 0, 0, 0.05)"
};

// --- ÍCONES ---
const IconMapPin = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const IconCake = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8"></path><path d="M2 21h20"></path><path d="M7 8v3"></path><path d="M12 8v3"></path><path d="M17 8v3"></path></svg>;
const IconNote = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const IconOrigin = ({ type, size = "14" }) => {
  const props = { width: size, height: size, strokeWidth: "2.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
    case 'Site': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    default: return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;
  }
};

const getStatusColor = (s) => {
  if (s === 'Agendado') return theme.info;
  if (s === 'Em tratamento') return theme.success;
  if (s === 'Não qualificado') return theme.gray;
  return theme.primary;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [animate, setAnimate] = useState(true);

  // States Formulário
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [statusLead, setStatusLead] = useState('Aberto');
  const [notasLead, setNotasLead] = useState(''); // NOVO ESTADO
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

  const handleMoneyChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setValorOrcamento(v);
  };

  const handleCepChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8);
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2');
    setCepLead(v);
  };

  const leadsFiltrados = leads.filter(l => {
    const matchBusca = l.nome.toLowerCase().includes(filtroBusca.toLowerCase()) || (l.notas || "").toLowerCase().includes(filtroBusca.toLowerCase());
    const matchOrigem = filtroOrigem === 'Todos' || l.origem === filtroOrigem;
    const matchStatus = filtroStatus === 'Todos' || l.status === filtroStatus;
    return matchBusca && matchOrigem && matchStatus;
  });

  const somaOrcamentos = leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0);

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView === 'dashboard') { 
        setIdEditando(null); setNomeLead(''); setCepLead(''); setIdadeLead(''); 
        setValorOrcamento(''); setStatusLead('Aberto'); setNotasLead('');
      }
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
      const payload = { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, origem: origemLead, status: statusLead, notas: notasLead, categoria, userId: user.uid };
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
          <button onClick={() => navigateTo('dashboard')} style={{ padding: '10px 16px', background: view === 'dashboard' ? '#fff' : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>Dashboard</button>
          <button onClick={() => navigateTo('novoLead')} style={{ padding: '10px 18px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>+ Novo Lead</button>
        </div>
      </nav>

      <main style={{ padding: '30px 5%', maxWidth: 1100, margin: '0 auto' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 25, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 150, background: '#fff', padding: 18, borderRadius: 18, boxShadow: theme.shadow }}>
                    <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>LEADS FILTRADOS</span>
                    <h4 style={{ fontSize: 22, margin: 0, fontWeight: 800 }}>{leadsFiltrados.length}</h4>
                </div>
                <div style={{ flex: 1.5, minWidth: 200, background: '#fff', padding: 18, borderRadius: 18, boxShadow: theme.shadow }}>
                    <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>EXPECTATIVA FINANCEIRA</span>
                    <h4 style={{ fontSize: 22, margin: 0, fontWeight: 800, color: theme.success }}>{somaOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 5 }}>
              {['Todos', 'Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: filtroStatus === s ? getStatusColor(s) : '#fff', color: filtroStatus === s ? '#fff' : theme.gray, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: theme.shadow }}>
                  {s}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 25, overflowX: 'auto', paddingBottom: 8 }}>
              {['Todos', 'Instagram', 'Facebook', 'WhatsApp', 'Site'].map(o => (
                <button key={o} onClick={() => setFiltroOrigem(o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 100, border: 'none', background: filtroOrigem === o ? theme.text : '#fff', color: filtroOrigem === o ? '#fff' : theme.gray, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: theme.shadow }}>
                  <IconOrigin type={o} size="14" /> {o}
                </button>
              ))}
            </div>

            <input type="text" placeholder="Buscar por nome ou observação..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', marginBottom: 25, boxSizing: 'border-box' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {leadsFiltrados.map(l => (
                <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, position: 'relative', borderTop: `4px solid ${getStatusColor(l.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', color: getStatusColor(l.status), background: `${getStatusColor(l.status)}15`, padding: '4px 8px', borderRadius: 6 }}>
                      {l.status || 'Aberto'}
                    </span>
                    <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setOrigemLead(l.origem); setStatusLead(l.status || 'Aberto'); setNotasLead(l.notas || ''); setView('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}>EDITAR</button>
                  </div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: 18, fontWeight: 700 }}>{l.nome}</h4>
                  <p style={{ margin: '0 0 12px 0', fontWeight: 800, color: theme.success, fontSize: 16 }}>{l.valor || 'R$ 0,00'}</p>
                  
                  {/* EXIBIÇÃO DAS NOTAS NO CARD */}
                  {l.notas && (
                    <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, marginBottom: 15, display: 'flex', gap: 8, borderLeft: `3px solid ${theme.lightGray}` }}>
                        <div style={{ color: theme.gray, marginTop: 2 }}><IconNote /></div>
                        <p style={{ margin: 0, fontSize: 12, color: theme.gray, lineHeight: '1.4', fontWeight: 500 }}>{l.notas}</p>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 700, color: theme.gray, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconOrigin type={l.origem} /> {l.origem}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconMapPin /> {l.cep}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <IconStarBadge isHigh={l.categoria === 'HIGH TICKET'} /> 
                        <span style={{ color: l.categoria === 'HIGH TICKET' ? '#eab308' : theme.gray }}>{l.categoria}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ background: '#fff', padding: '40px 35px', borderRadius: 28, boxShadow: theme.shadow }}>
              <h3 style={{ marginTop: 0, marginBottom: 25, fontSize: 26, fontWeight: 800, letterSpacing: '-1.2px' }}>
                {idEditando ? "Editar" : "Novo"} <span style={{ color: theme.primary }}>Lead</span>
              </h3>
              <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>STATUS</label>
                        <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: 700, color: getStatusColor(statusLead) }}>
                            <option value="Aberto">Aberto</option>
                            <option value="Agendado">Agendado</option>
                            <option value="Em tratamento">Em tratamento</option>
                            <option value="Não qualificado">Não qualificado</option>
                        </select>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>ORIGEM</label>
                        <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ padding: '12px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', fontWeight: 700 }}>
                            <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Site</option><option>Outros</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>NOME DO PACIENTE</label>
                  <input required value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>NOTAS DE ATENDIMENTO</label>
                  <textarea 
                    placeholder="Ex: Tem medo de agulha, interessada em Invisalign..." 
                    value={notasLead} 
                    onChange={e=>setNotasLead(e.target.value)} 
                    style={{ padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', minHeight: '80px', fontFamily: 'inherit', fontSize: '14px', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>ORÇAMENTO ESTIMADO</label>
                  <input value={valorOrcamento} onChange={handleMoneyChange} style={{ padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 800, color: theme.success }} />
                </div>

                <div style={{ display: 'flex', gap: 15 }}>
                  <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>CEP</label>
                    <input required value={cepLead} onChange={handleCepChange} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, color: theme.gray }}>IDADE</label>
                    <input required type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #e2e8f0', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <button type="submit" disabled={isSaving} style={{ padding: '16px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>
                  {isSaving ? "PROCESSANDO..." : "SALVAR ALTERAÇÕES"}
                </button>
                <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
