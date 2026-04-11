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

// --- TEMA E CORES ---
const THEME = {
  primary: '#ff6b00',
  secondary: '#1e293b',
  bg: '#fcfcfd',
  card: '#ffffff',
  border: '#f1f5f9',
  text: '#334155',
  textLight: '#94a3b8',
  // Fontes suaves e menos rígidas (estilo moderno)
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

const ActionButton = ({ onClick, children, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: isHovered ? '#f8fafc' : 'transparent',
        border: 'none',
        color: isHovered ? hoverColor : '#cbd5e1',
        cursor: 'pointer', transition: '0.2s',
        padding: '8px', borderRadius: '12px'
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
  
  // States Form / Login
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

  // --- LÓGICA DE CALENDÁRIO ---
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

  // --- MÉTRICAS ---
  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAgendado = leads.filter(l => l.status === 'Agendado').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
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
      status: statusLead, categoria, userId: user.uid, updatedAt: serverTimestamp()
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
    setStatusLead(l.status); setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setDataAgendamento(''); setOrigemLead('Instagram'); setValorOrcamento('');
    setStatusLead('Pendente');
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', color: THEME.primary, fontFamily: THEME.fontFamily}}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.fontFamily }}>
      
      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:'320px', padding:'40px', background:'#fff', borderRadius:'30px', boxShadow:'0 20px 50px rgba(0,0,0,0.05)', textAlign:'center'}}>
            <h1 style={{fontSize:'24px', fontWeight:'900', marginBottom:'30px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h1>
            <form onSubmit={async (e) => { e.preventDefault(); const email = `${celular.replace(/\D/g, '')}@klinni.ia`; try { await signInWithEmailAndPassword(auth, email, password); } catch(err){ alert("Chave incorreta."); } }} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} style={{padding:'14px', borderRadius:'14px', border:'1px solid #eee', outline:'none'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'14px', borderRadius:'14px', border:'1px solid #eee', outline:'none'}} />
              <button style={{padding:'16px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'14px', fontWeight:'600', cursor:'pointer', marginTop:'10px'}}>Entrar</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
            <div style={{display:'flex', gap:'25px'}}>
              <button onClick={()=>{setView('dashboard'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='dashboard'?THEME.primary:THEME.textLight}}>Dashboard</button>
              <button onClick={()=>{setView('novoLead'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='novoLead'?THEME.primary:THEME.textLight}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{background:'none', border:'none', color:THEME.textLight, cursor:'pointer', fontSize:'12px'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px', maxWidth:'1200px', margin:'0 auto'}}>
            {view === 'dashboard' && (
              <>
                {/* CALENDÁRIO SOFT */}
                <div style={{marginBottom: '40px'}}>
                  <h3 style={{fontSize:'12px', fontWeight:'800', color:THEME.textLight, marginBottom:'15px', textTransform:'uppercase'}}>Próximos Agendamentos</h3>
                  <div style={{display:'flex', gap:'12px', overflowX:'auto', paddingBottom:'10px'}}>
                    {getProximosDias().map((dia, idx) => {
                      const leadsDia = getLeadsPorDia(dia);
                      return (
                        <div key={idx} style={{minWidth:'150px', background:'#fff', padding:'15px', borderRadius:'20px', border:'1px solid #f1f5f9', boxShadow:'0 4px 10px rgba(0,0,0,0.01)'}}>
                          <div style={{fontSize:'10px', color:idx===0?THEME.primary:'#94a3b8', fontWeight:'800', marginBottom:'10px'}}>
                            {dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }).toUpperCase()}
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                            {leadsDia.length > 0 ? leadsDia.map(l => (
                              <div key={l.id} style={{fontSize:'9px', background:THEME.secondary, color:'#fff', padding:'6px', borderRadius:'8px', fontWeight:'600'}}>
                                {l.dataAgendamento.split('T')[1]} • {l.nome.split(' ')[0]}
                              </div>
                            )) : <div style={{fontSize:'9px', color:'#e2e8f0'}}>Vazio</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* FAROL */}
                <div style={{display:'flex', gap:'20px', marginBottom:'40px'}}>
                  {[
                    { label: 'Pendente', valor: totalPendente, color: '#f59e0b', bg: '#fffbeb' },
                    { label: 'Agendado', valor: totalAgendado, color: '#3b82f6', bg: '#eff6ff' },
                    { label: 'Em Atendimento', valor: totalAtendimento, color: '#10b981', bg: '#ecfdf5' }
                  ].map((item, i) => (
                    <div key={i} style={{flex:1, background:'#fff', padding:'20px', borderRadius:'20px', border:'1px solid #f1f5f9', display:'flex', alignItems:'center'}}>
                      <div style={{width:'40px', height:'40px', borderRadius:'12px', background:item.bg, color:item.color, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>R$</div>
                      <div style={{marginLeft:'15px'}}>
                        <div style={{fontSize:'10px', color:THEME.textLight, fontWeight:'700'}}>{item.label.toUpperCase()}</div>
                        <div style={{fontSize:'18px', fontWeight:'800'}}>R$ {formatarMoeda(item.valor)}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* LISTAGEM */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                  {leads.map(l => (
                    <div key={l.id} style={{background:'#fff', padding:'25px', borderRadius:'24px', border:'1px solid #f1f5f9', position:'relative'}}>
                      <div style={{position:'absolute', right:'15px', top:'15px', display:'flex'}}>
                        <ActionButton onClick={()=>iniciarEdicao(l)} hoverColor={THEME.primary}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg></ActionButton>
                      </div>
                      <div style={{fontSize:'9px', fontWeight:'800', color:THEME.primary, marginBottom:'5px'}}>{l.categoria}</div>
                      <h4 style={{margin:'0 0 15px 0', fontWeight:'700', fontSize:'16px'}}>{l.nome}</h4>
                      {l.dataAgendamento && <div style={{fontSize:'10px', color:'#3b82f6', fontWeight:'700', marginBottom:'10px'}}>📅 {new Date(l.dataAgendamento).toLocaleString('pt-BR')}</div>}
                      <div style={{fontSize:'10px', fontWeight:'700', color:THEME.textLight}}>VALOR: R$ {formatarMoeda(l.valorOrcamento)}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === 'novoLead' && (
              <div style={{maxWidth:'500px', margin:'0 auto', background:'#fff', padding:'40px', borderRadius:'30px', boxShadow:'0 10px 30px rgba(0,0,0,0.02)'}}>
                <h2 style={{textAlign:'center', marginBottom:'30px', fontWeight:'800'}}>{idLeadEditando?'Refinar':'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee', outline:'none'}} />
                  <div style={{background:'#fcfcfd', padding:'15px', borderRadius:'15px', border:'1px solid #f1f5f9'}}>
                    <label style={{fontSize:'10px', fontWeight:'800', color:THEME.primary, display:'block', marginBottom:'8px'}}>AGENDAMENTO</label>
                    <input type="datetime-local" value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #eee', borderRadius:'10px'}} />
                  </div>
                  <div style={{display:'flex', gap:'10px'}}>
                    <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} style={{flex:1, padding:'14px', borderRadius:'12px', border:'1px solid #eee'}} />
                    <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} style={{flex:1, padding:'14px', borderRadius:'12px', border:'1px solid #eee'}} />
                  </div>
                  <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee', background:'#fff'}}>
                    <option value="Pendente">Pendente</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Em atendimento">Em atendimento</option>
                  </select>
                  <input type="number" placeholder="Valor R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'14px', borderRadius:'12px', border:'1px solid #eee'}} />
                  <button type="submit" disabled={isSaving} style={{padding:'18px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'15px', fontWeight:'700', cursor:'pointer'}}>{isSaving?'Salvando...':'Confirmar'}</button>
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
