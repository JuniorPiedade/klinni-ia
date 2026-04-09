import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, limit } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
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
  shadow: "0 4px 15px -3px rgba(0, 0, 0, 0.07)"
};

// --- ÍCONES ---
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconNote = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const IconStarBadge = ({ isHigh }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={isHigh ? "#eab308" : "none"} stroke={isHigh ? "#eab308" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconOrigin = ({ type, size = "14" }) => {
  const props = { width: size, height: size, strokeWidth: "2.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
    case 'Site': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    default: return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle></svg>;
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
  const [animate, setAnimate] = useState(true);
  const [leads, setLeads] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // States Formulário
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [statusLead, setStatusLead] = useState('Aberto');
  const [notasLead, setNotasLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const qLeads = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
    });

    const qLogs = query(collection(db, "logs"), where("userId", "==", user.uid), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      logsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(logsData);
    });

    return () => { unsubLeads(); unsubLogs(); };
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

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView === 'novoLead' && !idEditando) {
        setNomeLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); setNotasLead(''); setStatusLead('Aberto'); setOrigemLead('Instagram');
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
      if (idEditando) {
        const leadAntigo = leads.find(l => l.id === idEditando);
        await updateDoc(doc(db, "leads", idEditando), payload);
        if (leadAntigo?.status !== statusLead) {
          await addDoc(collection(db, "logs"), { userId: user.uid, leadNome: nomeLead, statusAntigo: leadAntigo.status, statusNovo: statusLead, timestamp: serverTimestamp() });
        }
      } else {
        await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      }
      setIdEditando(null);
      navigateTo('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  const leadsFiltrados = leads.filter(l => 
    l.nome.toLowerCase().includes(filtroBusca.toLowerCase()) && 
    (filtroOrigem === 'Todos' || l.origem === filtroOrigem) && 
    (filtroStatus === 'Todos' || l.status === filtroStatus)
  );

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`.fade-in { opacity: 0; transform: translateY(8px); transition: all 0.3s ease; } .fade-in.active { opacity: 1; transform: translateY(0); }`}</style>
      
      {/* SIDEBAR */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '35px 25px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
        </div>
        <nav style={{ flex: 1, padding: '0 15px' }}>
          <button onClick={() => navigateTo('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer', marginBottom: 5 }}>
            <IconLayout /> Dashboard
          </button>
          <button onClick={() => navigateTo('logs')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'logs' ? `${theme.primary}15` : 'transparent', color: view === 'logs' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}>
            <IconHistory /> Histórico
          </button>
        </nav>
        <div style={{ padding: 20, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => { setIdEditando(null); navigateTo('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '40px 5%' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            {/* FAROL DE MÉTRICAS */}
            <div style={{ display: 'flex', gap: 15, marginBottom: 25 }}>
              <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow }}>
                <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>LEADS FILTRADOS</span>
                <h4 style={{ fontSize: 24, margin: 0, fontWeight: 800 }}>{leadsFiltrados.length}</h4>
              </div>
              <div style={{ flex: 1.5, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow }}>
                <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>EXPECTATIVA FINANCEIRA</span>
                <h4 style={{ fontSize: 24, margin: 0, fontWeight: 800, color: theme.success }}>
                  {leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h4>
              </div>
            </div>

            {/* FILTROS E BUSCA */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 5 }}>
              {['Todos', 'Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'].map(s => (
                <button key={s} onClick={() => setFiltroStatus(s)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: filtroStatus === s ? getStatusColor(s) : '#fff', color: filtroStatus === s ? '#fff' : theme.gray, fontWeight: 700, fontSize: 11, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: theme.shadow }}>{s}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, overflowX: 'auto', paddingBottom: 5 }}>
              {['Todos', 'Instagram', 'Facebook', 'WhatsApp', 'Site'].map(o => (
                <button key={o} onClick={() => setFiltroOrigem(o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 15px', borderRadius: 100, border: 'none', background: filtroOrigem === o ? theme.text : '#fff', color: filtroOrigem === o ? '#fff' : theme.gray, fontWeight: 700, fontSize: 11, cursor: 'pointer', boxShadow: theme.shadow }}>
                  <IconOrigin type={o} /> {o}
                </button>
              ))}
            </div>
            <input type="text" placeholder="Buscar lead por nome..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: 15, border: '1px solid #e2e8f0', marginBottom: 25, boxSizing: 'border-box' }} />

            {/* GRID DE LEADS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {leadsFiltrados.map(l => (
                <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, borderTop: `4px solid ${getStatusColor(l.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: getStatusColor(l.status), background: `${getStatusColor(l.status)}15`, padding: '4px 8px', borderRadius: 6 }}>{l.status}</span>
                    <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setOrigemLead(l.origem); setStatusLead(l.status); setNotasLead(l.notas || ''); navigateTo('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>EDITAR</button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 19 }}>{l.nome}</h4>
                  <p style={{ margin: '5px 0 15px 0', fontWeight: 800, color: theme.success, fontSize: 17 }}>{l.valor}</p>
                  {l.notas && <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 10, fontSize: 12, color: theme.gray, marginBottom: 15, display: 'flex', gap: 6 }}><IconNote /> {l.notas}</div>}
                  <div style={{ display: 'flex', gap: 12, fontSize: 10, fontWeight: 700, color: theme.gray, borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconOrigin type={l.origem} /> {l.origem}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>CEP {l.cep}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><IconStarBadge isHigh={l.categoria === 'HIGH TICKET'} /> {l.categoria}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'logs' ? (
          <div style={{ maxWidth: 800 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 25 }}>Histórico de <span style={{ color: theme.primary }}>Atividades</span></h3>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: theme.shadow, overflow: 'hidden' }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ padding: '20px 25px', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: 15 }}>{log.leadNome}</strong>
                    <p style={{ margin: '3px 0 0 0', fontSize: 12, color: theme.gray }}>Mudou para <span style={{ color: getStatusColor(log.statusNovo), fontWeight: 700 }}>{log.statusNovo}</span></p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: theme.gray }}>{log.timestamp?.toDate().toLocaleDateString('pt-BR')}<br/>{log.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto', background: '#fff', padding: 40, borderRadius: 28, boxShadow: theme.shadow }}>
            <h3 style={{ marginBottom: 25, fontWeight: 800 }}>{idEditando ? "Editar" : "Novo"} Lead</h3>
            <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                  <option>Aberto</option><option>Agendado</option><option>Em tratamento</option><option>Não qualificado</option>
                </select>
                <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                  <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Site</option>
                </select>
              </div>
              <input required placeholder="Nome do Paciente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <textarea placeholder="Notas e observações..." value={notasLead} onChange={e=>setNotasLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', minHeight: 80, fontFamily: 'inherit' }} />
              <input placeholder="Valor Estimado" value={valorOrcamento} onChange={handleMoneyChange} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 800, color: theme.success }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input required placeholder="CEP" value={cepLead} onChange={handleCepChange} style={{ flex: 2, padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
                <input required placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ flex: 1, padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              </div>
              <button type="submit" disabled={isSaving} style={{ padding: 18, background: theme.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer' }}>{isSaving ? "SALVANDO..." : "CONFIRMAR"}</button>
              <button type="button" onClick={() => navigateTo('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
