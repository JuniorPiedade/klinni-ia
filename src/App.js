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

const COLunas = ['Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'];

// --- ÍCONES ---
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconHistory = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconNote = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const IconStarBadge = ({ isHigh }) => <svg width="14" height="14" viewBox="0 0 24 24" fill={isHigh ? "#eab308" : "none"} stroke={isHigh ? "#eab308" : "#94a3b8"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;
const IconOrigin = ({ type, size = "12" }) => {
  const props = { width: size, height: size, strokeWidth: "2.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  switch (type) {
    case 'Instagram': return <svg {...props} viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>;
    case 'Facebook': return <svg {...props} viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>;
    case 'WhatsApp': return <svg {...props} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-10.6 8.38 8.38 0 0 1 3.8.9L21 3z"></path></svg>;
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

    const qLogs = query(collection(db, "logs"), where("userId", "==", user.uid), limit(50));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      logsData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
      setLogs(logsData);
    });

    return () => { unsubLeads(); unsubLogs(); };
  }, [user]);

  // Funções de Arrastar (Drag & Drop)
  const onDragStart = (e, leadId) => {
    e.dataTransfer.setData("leadId", leadId);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = async (e, novoStatus) => {
    const leadId = e.dataTransfer.getData("leadId");
    const lead = leads.find(l => l.id === leadId);
    if (lead && lead.status !== novoStatus) {
      await updateDoc(doc(db, "leads", leadId), { status: novoStatus });
      await addDoc(collection(db, "logs"), { 
        userId: user.uid, 
        leadNome: lead.nome, 
        statusAntigo: lead.status, 
        statusNovo: novoStatus, 
        timestamp: serverTimestamp() 
      });
    }
  };

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

  const navigateTo = (newView) => {
    setAnimate(false);
    setTimeout(() => {
      if (newView === 'novoLead' && !idEditando) {
        setNomeLead(''); setTelLead(''); setCepLead(''); setIdadeLead(''); setValorOrcamento(''); setNotasLead(''); setStatusLead('Aberto'); setOrigemLead('Instagram');
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
      const payload = { nome: nomeLead, telefone: telLead, cep: cepLead, idade: parseInt(idadeLead), valor: valorOrcamento, origem: origemLead, status: statusLead, notas: notasLead, categoria, userId: user.uid };
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

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', color: theme.primary, fontWeight: 'bold' }}>Klinni IA...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .fade-in { opacity: 0; transform: translateY(8px); transition: all 0.3s ease; } 
        .fade-in.active { opacity: 1; transform: translateY(0); }
        .kanban-col { min-height: 70vh; transition: background 0.2s ease; border-radius: 15px; padding: 10px; }
        .kanban-card:active { cursor: grabbing; transform: rotate(2deg); opacity: 0.8; }
        .kanban-card:hover { border-color: ${theme.primary}50; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
      
      {/* SIDEBAR */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 100 }}>
        <div style={{ padding: '35px 25px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2>
        </div>
        <nav style={{ flex: 1, padding: '0 15px' }}>
          <button onClick={() => navigateTo('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}15` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer', marginBottom: 5 }}><IconLayout /> Kanban</button>
          <button onClick={() => navigateTo('logs')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'logs' ? `${theme.primary}15` : 'transparent', color: view === 'logs' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconHistory /> Histórico</button>
        </nav>
        <div style={{ padding: 20, borderTop: '1px solid #f1f5f9' }}>
          <button onClick={() => { setIdEditando(null); navigateTo('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '30px 2%' }} className={`fade-in ${animate ? 'active' : ''}`}>
        {view === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
              <h3 style={{ margin: 0, fontWeight: 800 }}>Fluxo de Vendas</h3>
              <input type="text" placeholder="Pesquisar paciente..." value={filtroBusca} onChange={(e) => setFiltroBusca(e.target.value)} style={{ padding: '10px 15px', borderRadius: 10, border: '1px solid #e2e8f0', width: 250 }} />
            </div>

            {/* KANBAN BOARD */}
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20, alignItems: 'flex-start' }}>
              {COLunas.map(col => (
                <div 
                  key={col} 
                  className="kanban-col"
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, col)}
                  style={{ minWidth: 280, flex: 1, background: '#e2e8f040' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px 15px 10px' }}>
                    <span style={{ fontWeight: 800, fontSize: 12, color: theme.gray, textTransform: 'uppercase' }}>{col}</span>
                    <span style={{ background: '#cbd5e1', color: '#64748b', fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 900 }}>
                      {leads.filter(l => l.status === col).length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {leads
                      .filter(l => l.status === col && l.nome.toLowerCase().includes(filtroBusca.toLowerCase()))
                      .map(l => (
                        <div 
                          key={l.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, l.id)}
                          className="kanban-card"
                          style={{ padding: 15, background: '#fff', borderRadius: 15, boxShadow: theme.shadow, borderLeft: `4px solid ${getStatusColor(l.status)}`, cursor: 'grab', position: 'relative' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h5 style={{ margin: 0, fontSize: 14, fontWeight: 700, width: '80%' }}>{l.nome}</h5>
                            <IconStarBadge isHigh={l.categoria === 'HIGH TICKET'} />
                          </div>
                          
                          <p style={{ margin: '8px 0', fontSize: 13, fontWeight: 800, color: theme.success }}>{l.valor}</p>
                          
                          {l.notas && <div style={{ fontSize: 10, color: theme.gray, background: theme.bg, padding: '5px 8px', borderRadius: 6, margin: '8px 0', display: 'flex', gap: 4 }}><IconNote /> {l.notas.substring(0, 40)}...</div>}
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 800, color: theme.gray }}>
                              <IconOrigin type={l.origem} /> {l.origem.toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                               <button onClick={() => { setIdEditando(l.id); setNomeLead(l.nome); setTelLead(l.telefone || ''); setCepLead(l.cep); setIdadeLead(l.idade); setValorOrcamento(l.valor); setOrigemLead(l.origem); setStatusLead(l.status); setNotasLead(l.notas || ''); navigateTo('novoLead'); }} style={{ background: 'none', border: 'none', color: theme.primary, cursor: 'pointer', fontSize: 10, fontWeight: 800 }}>EDITAR</button>
                               {l.telefone && (
                                <a href={`https://wa.me/55${l.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" style={{ background: '#25D366', color: '#fff', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                                </a>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : view === 'logs' ? (
          <div style={{ maxWidth: 800 }}>
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 25 }}>Histórico de Atividades</h3>
            <div style={{ background: '#fff', borderRadius: 20, boxShadow: theme.shadow, overflow: 'hidden' }}>
              {logs.map((log, i) => (
                <div key={log.id} style={{ padding: '20px 25px', borderBottom: i === logs.length - 1 ? 'none' : '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1, paddingRight: 20 }}>
                    <strong style={{ fontSize: 15, display: 'block' }}>{log.leadNome}</strong>
                    <p style={{ margin: '3px 0 0 0', fontSize: 12, color: theme.gray }}>Mudou para <span style={{ color: getStatusColor(log.statusNovo), fontWeight: 700 }}>{log.statusNovo}</span></p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, color: theme.gray, minWidth: 80 }}>{log.timestamp?.toDate().toLocaleDateString('pt-BR')}<br/>{log.timestamp?.toDate().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
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
                  {COLunas.map(c => <option key={c}>{c}</option>)}
                </select>
                <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 700 }}>
                  <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Site</option>
                </select>
              </div>
              <input required placeholder="Nome do Paciente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <input required placeholder="WhatsApp (DDD) 9XXXX-XXXX" value={telLead} onChange={handleTelChange} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} />
              <textarea placeholder="Notas e observações..." value={notasLead} onChange={e=>setNotasLead(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', minHeight: 80, fontFamily: 'inherit' }} />
              <input placeholder="Valor Estimado" value={valorOrcamento} onChange={handleMoneyChange} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0', fontWeight: 800, color: theme.success }} />
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <div style={{ flex: 2 }}><input required placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} /></div>
                <div style={{ flex: 1 }}><input required placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 12, border: '1.5px solid #e2e8f0' }} /></div>
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
