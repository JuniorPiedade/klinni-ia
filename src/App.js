import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM", 
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
  storageBucket: "klinni-ia.firebasestorage.app",
  messagingSenderId: "761229946691",
  appId: "1:761229946691:web:feeceb3caed42445be09f6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- ESTILOS GLOBAIS DE TIPOGRAFIA E CORES ---
const THEME = {
  primary: '#ff6b00',
  primarySoft: '#fff7ed',
  textMain: '#2d3436',
  textLight: '#95a5a6',
  bgBody: '#f8fafc',
  cardBg: '#ffffff',
  radius: '20px',
  fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" // Fonte mais moderna e suave
};

const ActionButton = ({ onClick, children, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#fefefe' : 'transparent', 
        border: 'none',
        color: isHovered ? hoverColor : '#cbd5e1',
        cursor: 'pointer', transition: 'all 0.3s ease',
        padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center'
      }}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States Form
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [idLeadEditando, setIdLeadEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [nascimentoLead, setNascimentoLead] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [statusLead, setStatusLead] = useState('Pendente');
  const [obsLead, setObsLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // --- LÓGICA DE NEGÓCIO RESTAURADA ---
  const getProximosDias = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dias.push(d);
    }
    return dias;
  };

  const getLeadsPorDia = (data) => {
    const stringData = data.toISOString().split('T')[0];
    return leads.filter(l => l.dataAgendamento && l.dataAgendamento.startsWith(stringData));
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Agendado': return { bg: '#e0f2fe', color: '#0369a1' };
      case 'Em atendimento': return { bg: '#fef3c7', color: '#92400e' };
      case 'Pendente': return { bg: '#ffedd5', color: '#9a3412' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAgendado = leads.filter(l => l.status === 'Agendado').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const idade = nascimentoLead ? new Date().getFullYear() - new Date(nascimentoLead).getFullYear() : 0;
    const bairrosNobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (bairrosNobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";

    const dados = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      dataAgendamento, origem: origemLead, valorOrcamento: parseFloat(valorOrcamento) || 0, 
      status: statusLead, observacoes: obsLead, categoria, userId: user.uid, updatedAt: serverTimestamp()
    };

    try {
      if (idLeadEditando) await updateDoc(doc(db, "leads", idLeadEditando), dados);
      else await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() });
      resetForm(); setView('dashboard');
    } finally { setIsSaving(false); }
  };

  const iniciarEdicao = (l) => {
    setIdLeadEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep);
    setNascimentoLead(l.dataNascimento); setDataAgendamento(l.dataAgendamento || '');
    setOrigemLead(l.origem); setValorOrcamento(l.valorOrcamento || '');
    setStatusLead(l.status); setObsLead(l.observacoes || '');
    setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setDataAgendamento(''); setOrigemLead('Instagram'); setValorOrcamento('');
    setStatusLead('Pendente'); setObsLead('');
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: THEME.primary, fontFamily: THEME.fontFamily}}>Carregando Klinni...</div>;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bgBody, color: THEME.textMain, fontFamily: THEME.fontFamily, WebkitFontSmoothing: 'antialiased' }}>
      
      {user && (
        <>
          {/* NAV REFINADA */}
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'rgba(255,255,255,0.7)', backdropFilter: 'blur(20px)', borderBottom:'1px solid rgba(0,0,0,0.03)', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, fontWeight:'800', letterSpacing: '-0.5px', fontSize: '22px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
            <div style={{display:'flex', gap:'30px', alignItems: 'center'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '500', color: view==='dashboard'?THEME.primary:THEME.textLight, transition: '0.3s'}}>Dashboard</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '500', color: view==='novoLead'?THEME.primary:THEME.textLight, transition: '0.3s'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color: THEME.textLight, fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px', maxWidth: '1400px', margin: '0 auto'}}>
            {view === 'dashboard' && (
              <>
                {/* CALENDÁRIO COM CORES SUAVES */}
                <div style={{marginBottom: '50px'}}>
                  <div style={{display:'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                    <h3 style={{fontSize: '13px', fontWeight: '700', color: THEME.textLight, textTransform: 'uppercase', letterSpacing: '1px'}}>Agenda Semanal</h3>
                  </div>
                  <div style={{display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px'}}>
                    {getProximosDias().map((dia, idx) => {
                      const leadsDia = getLeadsPorDia(dia);
                      const isToday = idx === 0;
                      return (
                        <div key={idx} style={{minWidth: '180px', background: isToday ? '#fff' : 'transparent', border: isToday ? '1px solid #ffe8d6' : '1px solid #edf2f7', borderRadius: THEME.radius, padding: '20px', transition: '0.3s', boxShadow: isToday ? '0 10px 25px rgba(255,107,0,0.05)' : 'none'}}>
                          <div style={{fontSize: '11px', color: isToday ? THEME.primary : THEME.textLight, fontWeight: '700', marginBottom: '15px'}}>
                            {dia.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit' })}
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                            {leadsDia.length > 0 ? leadsDia.map(l => (
                              <div key={l.id} style={{fontSize:'10px', background: isToday ? THEME.primary : '#f1f5f9', color: isToday ? '#fff' : THEME.textMain, padding:'8px 12px', borderRadius:'10px', fontWeight:'600'}}>
                                {l.dataAgendamento.split('T')[1]} • {l.nome.split(' ')[0]}
                              </div>
                            )) : <div style={{fontSize:'10px', color: '#cbd5e1', fontWeight: '500'}}>Sem compromissos</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FAROL ESTRATÉGICO REFINADO */}
                <div style={{display: 'flex', gap: '25px', marginBottom: '50px'}}>
                  {[
                    { label: 'PENDENTE', valor: totalPendente, icon: '💳', bg: '#fff7ed', color: '#c2410c' },
                    { label: 'AGENDADO', valor: totalAgendado, icon: '📅', bg: '#eff6ff', color: '#1d4ed8' },
                    { label: 'ATENDIMENTO', valor: totalAtendimento, icon: '📈', bg: '#f0fdf4', color: '#15803d' }
                  ].map((item, i) => (
                    <div key={i} style={{flex: 1, background: '#fff', padding: '25px', borderRadius: THEME.radius, border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 4px 15px rgba(0,0,0,0.01)', display: 'flex', alignItems: 'center'}}>
                      <div style={{width: '50px', height: '50px', background: item.bg, borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>{item.icon}</div>
                      <div style={{marginLeft: '20px'}}>
                        <div style={{fontSize: '10px', color: THEME.textLight, fontWeight: '700', letterSpacing: '0.5px'}}>{item.label}</div>
                        <div style={{fontSize: '22px', color: THEME.textMain, fontWeight: '800', marginTop: '2px'}}>R$ {formatarMoeda(item.valor)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CARDS DE LEADS - DESIGN MAIS SUAVE */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                  {leads.map(l => {
                    const statusStyle = getStatusStyle(l.status);
                    return (
                      <div key={l.id} style={{background:'#fff', padding:'30px', borderRadius: THEME.radius, position:'relative', border:'1px solid rgba(0,0,0,0.02)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', transition: '0.3s'}}>
                        <div style={{position:'absolute', right:'20px', top:'20px', display:'flex', gap:'5px'}}>
                          <ActionButton onClick={() => iniciarEdicao(l)} hoverColor={THEME.primary}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg></ActionButton>
                          <ActionButton onClick={async () => { if(window.confirm("Apagar lead?")) await deleteDoc(doc(db, "leads", l.id)); }} hoverColor="#ef4444"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></ActionButton>
                        </div>
                        
                        <div style={{marginBottom: '20px'}}>
                          <span style={{fontSize:'9px', fontWeight:'800', color: l.categoria === 'HIGH TICKET' ? THEME.primary : '#cbd5e1', letterSpacing: '1px'}}>{l.categoria}</span>
                          <h4 style={{margin:'8px 0', fontSize:'18px', fontWeight:'700', color: THEME.textMain}}>{l.nome}</h4>
                          {l.dataAgendamento && (
                            <div style={{fontSize:'11px', color: '#6366f1', fontWeight:'600', display: 'flex', alignItems: 'center', gap: '5px'}}>
                              <span style={{fontSize: '14px'}}>🗓️</span> {new Date(l.dataAgendamento).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}
                            </div>
                          )}
                        </div>

                        <div style={{display:'flex', gap:'10px', marginBottom: '25px'}}>
                          <span style={{fontSize:'10px', background: statusStyle.bg, color: statusStyle.color, padding:'6px 12px', borderRadius:'10px', fontWeight:'700'}}>{l.status}</span>
                          <span style={{fontSize:'10px', background: '#f8fafc', color: '#94a3b8', padding:'6px 12px', borderRadius:'10px', fontWeight:'700'}}>{l.origem}</span>
                        </div>

                        <div style={{borderTop: '1px solid #f8fafc', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline'}}>
                          <span style={{fontSize: '10px', color: THEME.textLight, fontWeight: '600'}}>ORÇAMENTO</span>
                          <span style={{fontSize:'18px', color:THEME.textMain, fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* FORMULÁRIO COM DESIGN SOFT */}
            {view === 'novoLead' && (
              <div style={{maxWidth:'550px', margin:'0 auto', background:'#fff', padding:'50px', borderRadius: THEME.radius, boxShadow: '0 30px 60px rgba(0,0,0,0.05)'}}>
                <h2 style={{marginBottom:'40px', textAlign:'center', fontWeight:'800', letterSpacing: '-1px'}}>
                  {idLeadEditando ? 'Refinar Lead' : 'Novo Registro'}
                </h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <div style={{display:'flex', flexDirection: 'column', gap: '5px'}}>
                    <label style={{fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '5px'}}>NOME COMPLETO</label>
                    <input placeholder="Ex: Maria Silva" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #edf2f7', outline:'none', fontSize: '14px'}} />
                  </div>
                  
                  <div style={{background: THEME.primarySoft, padding: '20px', borderRadius: '18px', border: '1px solid #ffe8d6'}}>
                    <label style={{fontSize: '10px', fontWeight: '800', color: THEME.primary, display: 'block', marginBottom: '10px', letterSpacing: '0.5px'}}>DATA E HORA DO ATENDIMENTO</label>
                    <input type="datetime-local" value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{width: '100%', padding:'12px', borderRadius:'10px', border:'none', background: '#fff', fontSize: '14px', color: THEME.textMain}} />
                  </div>

                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '5px'}}>CEP</label>
                      <input placeholder="00000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{width: '100%', padding:'16px', borderRadius:'14px', border:'1px solid #edf2f7', fontSize: '14px'}} />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '5px'}}>NASCIMENTO</label>
                      <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{width: '100%', padding:'16px', borderRadius:'14px', border:'1px solid #edf2f7', fontSize: '14px'}} />
                    </div>
                  </div>
                  
                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '5px'}}>VALOR R$</label>
                      <input type="number" step="0.01" placeholder="0.00" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{width: '100%', padding:'16px', borderRadius:'14px', border:'1px solid #edf2f7', fontSize: '14px'}} />
                    </div>
                    <div style={{flex: 1}}>
                      <label style={{fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '5px'}}>STATUS</label>
                      <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{width: '100%', padding:'16px', borderRadius:'14px', border:'1px solid #edf2f7', background:'#fff', fontSize: '14px'}}>
                        <option value="Pendente">Pendente</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Em atendimento">Em atendimento</option>
                        <option value="Não qualificado">Não qualificado</option>
                      </select>
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:THEME.textMain, color:'white', border:'none', borderRadius:'16px', fontWeight:'700', cursor:'pointer', marginTop: '10px', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: '0.3s'}}>
                    {isSaving ? 'PROCESSANDO...' : 'SALVAR ALTERAÇÕES'}
                  </button>
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
