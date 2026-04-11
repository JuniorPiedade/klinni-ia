import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
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

// --- TEMA REFINADO ---
const THEME = {
  primary: '#ff6b00',
  secondary: '#1e293b',
  bg: '#fcfcfd',
  card: '#ffffff',
  border: '#f1f5f9',
  text: '#334155',
  textLight: '#94a3b8',
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
        border: 'none', color: isHovered ? hoverColor : '#cbd5e1',
        cursor: 'pointer', transition: '0.2s', padding: '8px', borderRadius: '12px'
      }}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('login');
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States Form / Auth
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [idLeadEditando, setIdLeadEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [nascimentoLead, setNascimentoLead] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [origemLead, setOrigemLead] = useState('INSTAGRAM'); // Ajustado para as novas opções
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

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = `${celular.replace(/\D/g, '')}@klinni.ia`;
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      alert(authMode === 'login' ? "Erro no acesso." : "Erro ao criar conta.");
    }
  };

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
    setOrigemLead(l.origem || 'INSTAGRAM'); setValorOrcamento(l.valorOrcamento || '');
    setStatusLead(l.status); setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setDataAgendamento(''); setOrigemLead('INSTAGRAM'); setValorOrcamento('');
    setStatusLead('Pendente');
  };

  if (loading) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff', color: THEME.primary, fontFamily: THEME.fontFamily}}>Aguarde...</div>;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.fontFamily }}>
      
      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <div style={{width:'320px', padding:'45px', background:'#fff', borderRadius:'35px', boxShadow:'0 25px 60px rgba(0,0,0,0.04)', textAlign:'center'}}>
            <h1 style={{fontSize:'24px', fontWeight:'900', marginBottom:'10px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h1>
            <p style={{fontSize:'12px', color:THEME.textLight, marginBottom:'30px'}}>{authMode === 'login' ? 'Login Profissional' : 'Nova Conta'}</p>
            <form onSubmit={handleAuth} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <input placeholder="WhatsApp" value={celular} onChange={e=>setCelular(e.target.value)} required style={{padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9', outline:'none', background:'#fcfcfd'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9', outline:'none', background:'#fcfcfd'}} />
              <button style={{padding:'18px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'16px', fontWeight:'700', cursor:'pointer', marginTop:'10px'}}>
                {authMode === 'login' ? 'ENTRAR' : 'CRIAR ACESSO'}
              </button>
            </form>
            <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{marginTop:'25px', background:'none', border:'none', color:THEME.primary, fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>
              {authMode === 'login' ? 'Criar minha conta' : 'Já tenho conta'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'rgba(255,255,255,0.85)', backdropFilter:'blur(12px)', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
            <div style={{display:'flex', gap:'30px', alignItems:'center'}}>
              <button onClick={()=>{setView('dashboard'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='dashboard'?THEME.primary:THEME.textLight}}>Dashboard</button>
              <button onClick={()=>{setView('novoLead'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='novoLead'?THEME.primary:THEME.textLight}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{background:'#f8fafc', border:'1px solid #edf2f7', padding:'6px 12px', borderRadius:'10px', color:THEME.textLight, cursor:'pointer', fontSize:'11px', fontWeight:'700'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px', maxWidth:'1200px', margin:'0 auto'}}>
            {view === 'dashboard' && (
              <>
                <div style={{marginBottom: '50px'}}>
                  <h3 style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight, marginBottom:'18px', textTransform:'uppercase', letterSpacing:'1px'}}>Agenda</h3>
                  <div style={{display:'flex', gap:'15px', overflowX:'auto', paddingBottom:'15px'}}>
                    {getProximosDias().map((dia, idx) => {
                      const leadsDia = getLeadsPorDia(dia);
                      const isToday = idx === 0;
                      return (
                        <div key={idx} style={{minWidth:'170px', background:'#fff', padding:'20px', borderRadius:'24px', border: isToday ? `1px solid ${THEME.primary}33` : '1px solid #f1f5f9'}}>
                          {/* VISUALIZAÇÃO APENAS DIA E MÊS (EX: 12 ABR) */}
                          <div style={{fontSize:'10px', color: isToday ? THEME.primary : '#94a3b8', fontWeight:'800', marginBottom:'12px'}}>
                            {dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                            {leadsDia.length > 0 ? leadsDia.map(l => (
                              <div key={l.id} style={{fontSize:'10px', background: isToday ? THEME.primary : THEME.secondary, color:'#fff', padding:'8px 12px', borderRadius:'10px', fontWeight:'600'}}>
                                {l.dataAgendamento.split('T')[1]} • {l.nome.split(' ')[0]}
                              </div>
                            )) : <div style={{fontSize:'10px', color:'#e2e8f0'}}>Livre</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'25px'}}>
                  {leads.map(l => (
                    <div key={l.id} style={{background:'#fff', padding:'30px', borderRadius:'28px', border:'1px solid #f8fafc', position:'relative'}}>
                      <div style={{position:'absolute', right:'20px', top:'20px', display:'flex'}}>
                        <ActionButton onClick={()=>iniciarEdicao(l)} hoverColor={THEME.primary}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg></ActionButton>
                      </div>
                      <div style={{fontSize:'9px', fontWeight:'900', color: THEME.primary, letterSpacing:'1px', marginBottom:'8px'}}>{l.categoria} | {l.origem || 'INSTAGRAM'}</div>
                      <h4 style={{margin:'0 0 12px 0', fontWeight:'700', fontSize:'18px', color:THEME.secondary}}>{l.nome}</h4>
                      {l.dataAgendamento && <div style={{fontSize:'11px', color:'#3b82f6', fontWeight:'700', marginBottom:'15px'}}>🗓️ {new Date(l.dataAgendamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} às {l.dataAgendamento.split('T')[1]}</div>}
                      <div style={{borderTop:'1px solid #fcfcfd', paddingTop:'15px', display:'flex', justifyContent:'space-between'}}>
                        <span style={{fontSize:'10px', color:THEME.textLight, fontWeight:'600'}}>ORÇAMENTO</span>
                        <span style={{fontSize:'17px', fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === 'novoLead' && (
              <div style={{maxWidth:'550px', margin:'0 auto', background:'#fff', padding:'50px', borderRadius:'35px', boxShadow:'0 20px 50px rgba(0,0,0,0.03)'}}>
                <h2 style={{textAlign:'center', marginBottom:'40px', fontWeight:'900'}}>{idLeadEditando?'Refinar Lead':'Novo Lead'}</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    <label style={{fontSize:'11px', fontWeight:'700', color:THEME.textLight, marginLeft:'5px'}}>NOME</label>
                    <input placeholder="Ex: Maria Oliveira" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9', outline:'none', background:'#fcfcfd'}} />
                  </div>
                  
                  <div style={{background:'#fff7ed', padding:'20px', borderRadius:'20px', border:'1px solid #ffe8d6'}}>
                    <label style={{fontSize:'10px', fontWeight:'800', color:THEME.primary, display:'block', marginBottom:'10px'}}>DATA E HORA DO ATENDIMENTO</label>
                    <input type="datetime-local" value={dataAgendamento} onChange={e=>setDataAgendamento(e.target.value)} style={{width:'100%', padding:'12px', border:'none', borderRadius:'12px', background:'#fff', fontSize:'14px'}} />
                  </div>

                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    <label style={{fontSize:'11px', fontWeight:'700', color:THEME.textLight, marginLeft:'5px'}}>ORIGEM DO LEAD</label>
                    <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9', background:'#fcfcfd', fontSize:'14px', outline:'none'}}>
                      <option value="INSTAGRAM">INSTAGRAM</option>
                      <option value="FACEBOOK">FACEBOOK</option>
                      <option value="SITE">SITE</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>

                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'11px', fontWeight:'700', color:THEME.textLight}}>CEP</label>
                      <input placeholder="40000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} style={{width:'100%', padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9'}} />
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'11px', fontWeight:'700', color:THEME.textLight}}>VALOR R$</label>
                      <input type="number" step="0.01" placeholder="0,00" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{width:'100%', padding:'16px', borderRadius:'16px', border:'1px solid #f1f5f9'}} />
                    </div>
                  </div>

                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'18px', fontWeight:'700', cursor:'pointer', marginTop:'15px'}}>
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
