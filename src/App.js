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
  bg: "#f8fafc", // Um pouco mais claro para destacar os cards
  card: "#ffffff",
  text: "#0f172a",
  gray: "#64748b",
  lightGray: "#e2e8f0",
  shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)"
};

const COLunas = ['Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'];
const ORIGENS = ['Todos', 'Instagram', 'Facebook', 'WhatsApp', 'Site'];

// --- ÍCONES SVG MINIMALISTAS ---
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconStarBadge = ({ isHigh }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={isHigh ? "#eab308" : "none"} stroke={isHigh ? "#eab308" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;

const IconOrigin = ({ type, size = "16", active = true }) => {
  const props = { width: size, height: size, strokeWidth: "2", stroke: active ? theme.primary : "#94a3b8", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
    case 'Site': return <svg {...props} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
    default: return <svg {...props} viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
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
  
  // Filtros
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');

  // Form States (simplificados)
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
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

  useEffect(() => {
    if (!user) return;
    const qLeads = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsubLeads = onSnapshot(qLeads, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLeads(data);
    });
    return () => unsubLeads();
  }, [user]);

  const onDragStart = (e, leadId) => { e.dataTransfer.setData("leadId", leadId); };
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = async (e, novoStatus) => {
    const leadId = e.dataTransfer.getData("leadId");
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== novoStatus) {
      await updateDoc(doc(db, "leads", leadId), { status: novoStatus });
    }
  };

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView === 'novoLead' && !idEditando) {
        setNomeLead(''); setTelLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); setStatusLead('Aberto'); setOrigemLead('Instagram');
      }
      setView(newView);
      setAnimate(true);
    }, 150);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const payload = { nome: nomeLead, telefone: telLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, origem: origemLead, status: statusLead, userId: user.uid };
    try {
      if (idEditando) { await updateDoc(doc(db, "leads", idEditando), payload); } 
      else { await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() }); }
      setIdEditando(null); navigateTo('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    setIsSaving(false);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(8px); transition: all 0.3s ease; } 
        .fade-in.active { opacity: 1; transform: translateY(0); }
        .kanban-col { min-height: 75vh; border-radius: 24px; padding: 12px; background: #f1f5f9; border: 1px solid #e2e8f0; }
        .origin-badge { cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px; border: 1px solid #e2e8f0; background: #fff; transition: all 0.2s ease; font-size: 11px; font-weight: 800; color: ${theme.gray}; }
        .origin-badge.active { border-color: ${theme.primary}; background: ${theme.primary}10; color: ${theme.primary}; }
        .search-container { position: relative; display: flex; align-items: center; width: 100%; max-width: 320px; }
        .search-container svg { position: absolute; left: 15px; color: ${theme.gray}; pointer-events: none; }
        .search-input { width: 100%; padding: 12px 15px 12px 42px; border-radius: 14px; border: 1px solid #e2e8f0; font-size: 13px; background: #fff; transition: border 0.2s ease; outline: none; }
        .search-input:focus { border-color: ${theme.primary}; box-shadow: 0 0 0 3px ${theme.primary}10; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '35px 25px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: theme.text }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
        </div>
        <nav style={{ flex: 1, padding: '0 15px' }}>
          <button onClick={() => navigateTo('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer', marginBottom: 5 }}><IconLayout /> Kanban</button>
          <button onClick={() => navigateTo('logs')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'logs' ? `${theme.primary}15` : 'transparent', color: view === 'logs' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconHistory /> Histórico</button>
        </nav>
        <div style={{ padding: 20, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => { setIdEditando(null); navigateTo('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '30px 40px' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            {/* BARRA SUPERIOR DE ORIGENS */}
            <div style={{ marginBottom: 35 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {ORIGENS.map(org => (
                  <div key={org} className={`origin-badge ${filtroOrigem === org ? 'active' : ''}`} onClick={() => setFiltroOrigem(org)}>
                    <IconOrigin type={org} active={filtroOrigem === org} />
                    {org.toUpperCase()}
                  </div>
                ))}
              </div>
            </div>

            {/* HEADER DO KANBAN COM BUSCA MINIMALISTA */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: 18, color: theme.text }}>Fluxo de Atendimento</h3>
              <div className="search-container">
                <IconSearch />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Buscar paciente pelo nome..." 
                  value={filtroBusca} 
                  onChange={(e) => setFiltroBusca(e.target.value)} 
                />
              </div>
            </div>

            {/* KANBAN BOARD */}
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
              {COLunas.map(col => (
                <div key={col} className="kanban-col" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} style={{ minWidth: 280, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 10px 15px 5px', borderBottom: `2px solid ${getStatusColor(col)}`, marginBottom: 20 }}>
                    <span style={{ fontWeight: 800, fontSize: 11, color: theme.text, textTransform: 'uppercase', letterSpacing: 0.5 }}>{col}</span>
                    <span style={{ color: theme.gray, fontSize: 10, fontWeight: 900 }}>
                      {leads.filter(l => l.status === col && (filtroOrigem === 'Todos' || l.origem === filtroOrigem) && l.nome.toLowerCase().includes(filtroBusca.toLowerCase())).length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leads
                      .filter(l => l.status === col && (filtroOrigem === 'Todos' || l.origem === filtroOrigem) && l.nome.toLowerCase().includes(filtroBusca.toLowerCase()))
                      .map(l => (
                        <div key={l.id} draggable onDragStart={(e) => onDragStart(e, l.id)}
                          style={{ 
                            padding: 16, background: '#fff', borderRadius: 20, boxShadow: theme.shadow, 
                            border: `1px solid ${getStatusColor(l.status)}15`, cursor: 'grab',
                            background: `${getStatusColor(l.status)}05`
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                            <h5 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{l.nome}</h5>
                            <IconStarBadge isHigh={l.categoria === 'HIGH TICKET'} />
                          </div>
                          <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: getStatusColor(l.status) }}>{l.valor}</p>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 15, alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: theme.gray }}>
                              <IconOrigin type={l.origem} size="10" /> {l.origem}
                            </div>
                            <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setTelLead(l.telefone || ''); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setOrigemLead(l.origem); setStatusLead(l.status); navigateTo('novoLead'); }} 
                              style={{ background: 'none', border: 'none', color: theme.gray, cursor: 'pointer', fontSize: 9, fontWeight: 800 }}>DETALHES</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            {/* View de Logs e Cadastro permanecem com a lógica anterior */}
          </div>
        )}
      </main>
    </div>
  );
}
