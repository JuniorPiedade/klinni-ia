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

// --- COMPONENTES AUXILIARES ---
const ActionButton = ({ onClick, children, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none', border: 'none',
        color: isHovered ? hoverColor : '#ddd',
        cursor: 'pointer', transition: 'all 0.2s ease',
        padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center'
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
  const [dataAgendamento, setDataAgendamento] = useState(''); // NOVO: Data do Atendimento
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [sexoLead, setSexoLead] = useState('Não Informado');
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

  // --- LÓGICA DO MINI CALENDÁRIO ---
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
      case 'Agendado': return { bg: '#eff6ff', color: '#1d4ed8' };
      case 'Em atendimento': return { bg: '#fffbeb', color: '#b45309' };
      case 'Pendente': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f8fafc', color: '#6b7280' };
    }
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    const idade = nascimentoLead ? new Date().getFullYear() - new Date(nascimentoLead).getFullYear() : 0;
    const bairrosNobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (bairrosNobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";

    const dados = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      dataAgendamento: dataAgendamento, // Salva a data do atendimento
      origem: origemLead, valorOrcamento: parseFloat(valorOrcamento) || 0, 
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

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#ff6b00'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '"Inter", sans-serif' }}>
      {user && (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom:'1px solid #f0f0f0', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, fontWeight:'900'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h2>
            <div style={{display:'flex', gap:'35px'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='dashboard'?'#ff6b00':'#888'}}>DASHBOARD</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='novoLead'?'#ff6b00':'#888'}}>+ NOVO LEAD</button>
              <button onClick={()=>signOut(auth)} style={{color:'#ccc', border:'none', background:'none', cursor:'pointer'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' && (
              <>
                {/* MINI CALENDÁRIO COM LEADS AGENDADOS */}
                <div style={{marginBottom: '40px'}}>
                  <h3 style={{fontSize: '11px', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase'}}>Agenda de Atendimentos</h3>
                  <div style={{display: 'flex', gap: '12px', overflowX: 'auto'}}>
                    {getProximosDias().map((dia, idx) => {
                      const leadsDia = getLeadsPorDia(dia);
                      return (
                        <div key={idx} style={{minWidth: '160px', background: 'white', border: '1px solid #f2f2f2', borderRadius: '18px', padding: '16px'}}>
                          <div style={{fontSize: '10px', color: idx === 0 ? '#ff6b00' : '#bbb', fontWeight: '800', marginBottom: '10px'}}>
                            {dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).toUpperCase()}
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                            {leadsDia.length > 0 ? leadsDia.map(l => (
                              <div key={l.id} style={{fontSize:'9px', background:'#1a1a1a', color:'white', padding:'6px', borderRadius:'8px', fontWeight:'700'}}>
                                {l.dataAgendamento.split('T')[1]} - {l.nome.split(' ')[0]}
                              </div>
                            )) : <div style={{fontSize:'9px', color:'#eee'}}>Livre</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LISTAGEM PRINCIPAL */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
                  {leads.map(l => (
                    <div key={l.id} style={{background:'white', padding:'25px', borderRadius:'24px', border:'1px solid #f5f5f5'}}>
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                        <span style={{fontSize:'9px', fontWeight:'800', color: '#ff6b00'}}>{l.categoria}</span>
                        <ActionButton onClick={() => iniciarEdicao(l)} hoverColor="#ff6b00"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg></ActionButton>
                      </div>
                      <h4 style={{margin:'0 0 10px 0', fontWeight:'700'}}>{l.nome}</h4>
                      {l.dataAgendamento && (
                        <div style={{fontSize:'10px', color:'#1d4ed8', fontWeight:'700', marginBottom:'10px'}}>
                          📅 {new Date(l.dataAgendamento).toLocaleString('pt-BR')}
                        </div>
                      )}
                      <span style={{fontSize:'9px', background: getStatusStyle(l.status).bg, color: getStatusStyle(l.status).color, padding:'4px 10px', borderRadius:'8px', fontWeight:'800'}}>{l.status}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === 'novoLead' && (
              <div style={{maxWidth:'500px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'32px', border:'1px solid #f5f5f5'}}>
                <h2 style={{marginBottom:'30px', textAlign:'center', fontWeight:'800'}}>{idLeadEditando ? 'Editar' : 'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <input placeholder="Nome Completo" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee'}} />
                  
                  <div style={{background: '#fcfcfc', padding: '15px', borderRadius: '14px', border: '1px solid #f0f0f0'}}>
                    <label style={{fontSize: '10px', fontWeight: '800', color: '#ff6b00', display: 'block', marginBottom: '8px'}}>DATA DO ATENDIMENTO (AGENDAMENTO)</label>
                    <input type="datetime-local" value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{width: '100%', padding:'10px', borderRadius:'8px', border:'1px solid #eee', background: 'white'}} />
                  </div>

                  <div style={{display:'flex', gap:'10px'}}>
                    <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee', flex:1}} />
                    <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee', flex:1}} />
                  </div>
                  
                  <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee', background:'white'}}>
                    <option value="Pendente">Pendente</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Em atendimento">Em atendimento</option>
                    <option value="Não qualificado">Não qualificado</option>
                  </select>

                  <button type="submit" disabled={isSaving} style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'700', cursor:'pointer', marginTop: '10px'}}>
                    {isSaving ? 'SALVANDO...' : 'CONFIRMAR'}
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
