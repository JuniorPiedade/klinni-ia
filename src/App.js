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
const IconStarBadge = ({ isHigh }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={isHigh ? "#eab308" : "none"} stroke={isHigh ? "#eab308" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconOrigin = ({ type, size = "14" }) => {
  const props = { width: size, height: size, strokeWidth: "2.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
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
  const [logs, setLogs] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // States Formulário
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [statusLead, setStatusLead] = useState('Aberto');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  // --- BUSCA DE DADOS (PROTEGIDA) ---
  useEffect(() => {
    if (!user) return;

    // Leads
    const qLeads = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setLeads(data);
    });

    // Logs (COM ORDENAÇÃO MANUAL PARA EVITAR TELA BRANCA)
    const qLogs = query(collection(db, "logs"), where("userId", "==", user.uid), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Ordena no JS: mais recentes primeiro
      logsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(logsData);
    }, (err) => console.warn("Aguardando índice de logs...", err));

    return () => { unsubLeads(); unsubLogs(); };
  }, [user]);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const cepLimpo = cepLead.replace(/\D/g, '');
    const nobres = ['40140','41940','40080','41810','41820','41760'];
    const categoria = nobres.includes(cepLimpo.substring(0, 5)) && parseInt(idadeLead) >= 20 ? "HIGH TICKET" : "Ticket Médio";

    try {
      const payload = { nome: nomeLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, origem: origemLead, status: statusLead, categoria, userId: user.uid };
      
      if (idEditando) {
        const leadAntigo = leads.find(l => l.id === idEditando);
        await updateDoc(doc(db, "leads", idEditando), payload);
        
        // Registrar Histórico se o status mudou
        if (leadAntigo && leadAntigo.status !== statusLead) {
          await addDoc(collection(db, "logs"), {
            userId: user.uid,
            leadNome: nomeLead,
            statusAntigo: leadAntigo.status || 'Aberto',
            statusNovo: statusLead,
            timestamp: serverTimestamp()
          });
        }
      } else {
        await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
      }
      setView('dashboard');
      setIdEditando(null);
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  const leadsFiltrados = leads.filter(l => 
    l.nome.toLowerCase().includes(filtroBusca.toLowerCase()) && 
    (filtroStatus === 'Todos' || l.status === filtroStatus)
  );

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      
      {/* SIDEBAR FIXA */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh' }}>
        <div style={{ padding: '35px 25px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
        </div>
        <nav style={{ flex: 1, padding: '0 15px' }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer', marginBottom: 5 }}>
            <IconLayout /> Dashboard
          </button>
          <button onClick={() => setView('logs')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'logs' ? `${theme.primary}15` : 'transparent', color: view === 'logs' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}>
            <IconHistory /> Histórico
          </button>
        </nav>
        <div style={{ padding: 20 }}>
          <button onClick={() => { setIdEditando(null); setNomeLead(''); setView('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, marginLeft: 260, padding: '40px 5%' }}>
        
        {view === 'dashboard' && (
          <div>
            <div style={{ display: 'flex', gap: 15, marginBottom: 30 }}>
              <div style={{ flex: 1, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow }}>
                <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>LEADS ATIVOS</span>
                <h4 style={{ fontSize: 24, margin: 0 }}>{leadsFiltrados.length}</h4>
              </div>
              <div style={{ flex: 1.5, background: '#fff', padding: 20, borderRadius: 20, boxShadow: theme.shadow }}>
                <span style={{ fontSize: 10, color: theme.gray, fontWeight: 800 }}>VALOR EM NEGOCIAÇÃO</span>
                <h4 style={{ fontSize: 24, margin: 0, color: theme.success }}>
                  {leadsFiltrados.reduce((acc, curr) => acc + (Number(curr.valor?.replace(/\D/g, '') || 0) / 100), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h4>
              </div>
            </div>

            <input type="text" placeholder="Pesquisar paciente..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ width: '100%', padding: '15px', borderRadius: 15, border: '1px solid #e2e8f0', marginBottom: 25 }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {leadsFiltrados.map(l => (
                <div key={l.id} style={{ padding: 20, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, borderTop: `4px solid ${getStatusColor(l.status)}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontWeight: 900, color: getStatusColor(l.status), background: `${getStatusColor(l.status)}10`, padding: '4px 8px', borderRadius: 6 }}>{l.status}</span>
                    <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setStatusLead(l.status); setView('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, fontWeight: 800, cursor: 'pointer', fontSize: 11 }}>EDITAR</button>
                  </div>
                  <h4 style={{ margin: 0, fontSize: 18 }}>{l.nome}</h4>
                  <p style={{ margin: '5px 0 15px 0', fontWeight: 800, color: theme.success }}>{l.valor}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 10, color: theme.gray, fontWeight: 700 }}>
                     <IconStarBadge isHigh={l.categoria === 'HIGH TICKET'} /> {l.categoria}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'logs' && (
          <div style={{ maxWidth: 800 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 25 }}>Histórico de <span style={{ color: theme.primary }}>Movimentações</span></h3>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: theme.shadow, overflow: 'hidden' }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ padding: '20px 25px', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong style={{ fontSize: 15 }}>{log.leadNome}</strong>
                    <p style={{ margin: '3px 0 0 0', fontSize: 12, color: theme.gray }}>Mudou de <span style={{ color: getStatusColor(log.statusAntigo) }}>{log.statusAntigo}</span> para <span style={{ color: getStatusColor(log.statusNovo), fontWeight: 700 }}>{log.statusNovo}</span></p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: theme.gray }}>
                    {log.timestamp?.toDate().toLocaleDateString('pt-BR')} <br/> {log.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'novoLead' && (
          <div style={{ maxWidth: 450, margin: '0 auto', background: '#fff', padding: 40, borderRadius: 25, boxShadow: theme.shadow }}>
            <h3 style={{ marginBottom: 30 }}>{idEditando ? "Editar" : "Novo"} Lead</h3>
            <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input required placeholder="Nome do Paciente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <input placeholder="Valor (R$)" value={valorOrcamento} onChange={e => setValorOrcamento(e.target.value)} style={{ padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input required placeholder="CEP" value={cepLead} onChange={e => setCepLead(e.target.value)} style={{ flex: 2, padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
                <input required placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              </div>
              <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{ padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                <option>Aberto</option><option>Agendado</option><option>Em tratamento</option><option>Não qualificado</option>
              </select>
              <button type="submit" disabled={isSaving} style={{ padding: 16, background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>{isSaving ? "SALVANDO..." : "CONFIRMAR"}</button>
              <button type="button" onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 700 }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
