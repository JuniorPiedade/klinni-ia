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
  success: "#10b981",
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
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const IconClock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;

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
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // States Formulário
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [statusLead, setStatusLead] = useState('Aberto');
  const [notasLead, setNotasLead] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horaAgendamento, setHoraAgendamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const STATUS_LIST = ['Todos', 'Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubLeads = onSnapshot(query(collection(db, "leads"), where("userId", "==", user.uid)), (snapshot) => {
      setLeads(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubLeads();
  }, [user]);

  const handleMoneyChange = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = (Number(v) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    setValorOrcamento(v);
  };

  const handleTelChange = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length > 9) v = `${v.substring(0, 10)}-${v.substring(10)}`;
    setTelLead(v);
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
        setNomeLead(''); setTelLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); setNotasLead(''); setStatusLead('Aberto'); setDataAgendamento(''); setHoraAgendamento('');
      }
      setView(newView);
      setAnimate(true);
    }, 150);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { 
        nome: nomeLead, telefone: telLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, 
        origem: origemLead, status: statusLead, notas: notasLead, 
        dataAgendamento: statusLead === 'Agendado' ? dataAgendamento : null,
        horaAgendamento: statusLead === 'Agendado' ? horaAgendamento : null,
        userId: user.uid 
      };
      if (idEditando) await updateDoc(doc(db, "leads", idEditando), payload);
      else await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      setIdEditando(null); navigateTo('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  const leadsFiltrados = leads.filter(l => 
    l.nome?.toLowerCase().includes(filtroBusca.toLowerCase()) && 
    (filtroStatus === 'Todos' || l.status === filtroStatus)
  );

  const hoje = new Date().toISOString().split('T')[0];
  const agendamentosHoje = leads.filter(l => l.status === 'Agendado' && l.dataAgendamento === hoje);

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary }}>Carregando...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(8px); transition: all 0.3s ease; } 
        .fade-in.active { opacity: 1; transform: translateY(0); }
        .filter-chip { cursor: pointer; padding: 10px 18px; border-radius: 12px; background: #fff; border: 1.5px solid #e2e8f0; font-size: 11px; font-weight: 800; color: ${theme.gray}; transition: 0.2s; display: flex; align-items: center; gap: 8px; }
        .filter-chip.active { background: ${theme.primary}10; border-color: ${theme.primary}; color: ${theme.primary}; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%; }
        .full-width { grid-column: span 2; }
      `}</style>
      
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '35px 25px' }}><h2 style={{ fontSize: 20, fontWeight: 800 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2></div>
        <nav style={{ padding: '0 15px' }}>
          <button onClick={() => navigateTo('dashboard')} style={{ width: '100%', display: 'flex', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconLayout /> Dashboard</button>
        </nav>
        <div style={{ padding: 20, position: 'absolute', bottom: 0, width: '100%' }}>
          <button onClick={() => { setIdEditando(null); navigateTo('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '40px 5%' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 30 }}>
               {/* AGENDA DO DIA */}
               <div style={{ flex: 1, background: '#fff', padding: '24px', borderRadius: 24, boxShadow: theme.shadow, border: `1px solid ${theme.info}20` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                  <IconCalendar />
                  <span style={{ fontSize: 11, color: theme.info, fontWeight: 700 }}>AGENDA DE HOJE</span>
                </div>
                {agendamentosHoje.length > 0 ? (
                  agendamentosHoje.map(a => (
                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{a.nome}</span>
                      <span style={{ fontSize: 13, color: theme.info, fontWeight: 700 }}>{a.horaAgendamento}</span>
                    </div>
                  ))
                ) : <p style={{ fontSize: 12, color: theme.gray }}>Nenhum agendamento para hoje.</p>}
              </div>

              <div style={{ flex: 1, background: '#fff', padding: '24px', borderRadius: 24, boxShadow: theme.shadow }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></div><span style={{ fontSize: 11, color: theme.gray, fontWeight: 600 }}>VALOR EM NEGOCIAÇÃO</span></div>
                <h4 style={{ fontSize: 28, margin: 0, fontWeight: 400, color: '#059669' }}>{leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</h4>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {STATUS_LIST.map(st => (
                <div key={st} className={`filter-chip ${filtroStatus === st ? 'active' : ''}`} onClick={() => setFiltroStatus(st)}>
                  {st !== 'Todos' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(st) }}></div>}
                  {st.toUpperCase()}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
              {leadsFiltrados.map(l => (
                <div key={l.id} style={{ padding: 22, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, borderTop: `4px solid ${getStatusColor(l.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: getStatusColor(l.status), background: `${getStatusColor(l.status)}15`, padding: '4px 8px', borderRadius: 6 }}>{l.status}</span>
                    <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setTelLead(l.telefone || ''); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setStatusLead(l.status); setDataAgendamento(l.dataAgendamento || ''); setHoraAgendamento(l.horaAgendamento || ''); navigateTo('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>EDITAR</button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>{l.nome}</h4>
                  <p style={{ margin: '4px 0 12px 0', color: '#059669', fontWeight: 600 }}>{l.valor}</p>
                  {l.status === 'Agendado' && l.dataAgendamento && (
                    <div style={{ fontSize: 12, color: theme.info, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IconClock /> {new Date(l.dataAgendamento).toLocaleDateString('pt-BR')} às {l.horaAgendamento}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: '40px', borderRadius: 28, boxShadow: theme.shadow }}>
            <h3 style={{ marginBottom: 25, fontWeight: 800 }}>{idEditando ? "Editar" : "Novo"} Lead</h3>
            <form onSubmit={handleSalvarLead} className="form-grid">
              <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                {STATUS_LIST.filter(s=>s!=='Todos').map(s=><option key={s}>{s}</option>)}
              </select>
              <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                <option>Instagram</option><option>WhatsApp</option><option>Site</option>
              </select>

              {statusLead === 'Agendado' && (
                <div className="full-width" style={{ background: `${theme.info}08`, padding: 20, borderRadius: 15, border: `1px dashed ${theme.info}40`, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: 10, fontWeight: 800, color: theme.info }}>DATA</label><input type="date" required value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} /></div>
                  <div><label style={{ fontSize: 10, fontWeight: 800, color: theme.info }}>HORA</label><input type="time" required value={horaAgendamento} onChange={e=>setHoraAgendamento(e.target.value)} style={{ width: '100%', padding: 10, border: '1px solid #e2e8f0', borderRadius: 8 }} /></div>
                </div>
              )}

              <input className="full-width" required placeholder="Nome do Paciente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <input className="full-width" required placeholder="WhatsApp" value={telLead} onChange={handleTelChange} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <input className="full-width" placeholder="Valor Estimado" value={valorOrcamento} onChange={handleMoneyChange} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700, color: theme.success }} />
              
              {/* CORREÇÃO DO ESQUADRO: CEP e IDADE lado a lado */}
              <input required placeholder="CEP" value={cepLead} onChange={handleCepChange} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <input required placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />

              <button type="submit" className="full-width" style={{ padding: 18, background: theme.primary, color: '#fff', border: 'none', borderRadius: 14, fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>{isSaving ? "SALVANDO..." : "CONFIRMAR"}</button>
              <button type="button" className="full-width" onClick={() => navigateTo('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 700, cursor: 'pointer' }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
