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

// --- COMPONENTES DE INTERFACE ---
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
  
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [idLeadEditando, setIdLeadEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [nascimentoLead, setNascimentoLead] = useState('');
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

  // --- LÓGICA DO CALENDÁRIO ---
  const getProximosDias = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dias.push(d);
    }
    return dias;
  };

  const leadsAgendados = leads.filter(l => l.status === 'Agendado');

  const getStyleStatus = (status) => {
    switch (status) {
      case 'Agendado': return { bg: '#eff6ff', color: '#1d4ed8' };
      case 'Em atendimento': return { bg: '#fffbeb', color: '#b45309' };
      case 'Pendente': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f8fafc', color: '#4b5563' };
    }
  };

  const getStyleOrigem = (origem) => {
    switch (origem) {
      case 'Instagram': return { bg: '#f5f3ff', color: '#6d28d9' };
      case 'Site': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f1f5f9', color: '#475569' };
    }
  };

  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dados = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      origem: origemLead, sexo: sexoLead, valorOrcamento: parseFloat(valorOrcamento) || 0, 
      status: statusLead, observacoes: obsLead, userId: user.uid, updatedAt: serverTimestamp()
    };
    try {
      if (idLeadEditando) await updateDoc(doc(db, "leads", idLeadEditando), dados);
      else await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() });
      resetForm(); setView('dashboard');
    } finally { setIsSaving(false); }
  };

  const iniciarEdicao = (l) => {
    setIdLeadEditando(l.id); setNomeLead(l.nome); setCepLead(l.cep);
    setNascimentoLead(l.dataNascimento); setOrigemLead(l.origem);
    setValorOrcamento(l.valorOrcamento || ''); setStatusLead(l.status || 'Pendente'); setObsLead(l.observacoes || '');
    setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setOrigemLead('Instagram'); setValorOrcamento(''); setStatusLead('Pendente'); setObsLead('');
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#ff6b00', fontWeight: '300'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '"Inter", sans-serif' }}>
      
      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
           <div style={{width:'350px', padding:'50px', textAlign:'center', border:'1px solid #f2f2f2', borderRadius:'32px'}}>
            <h1 style={{fontSize:'28px', color:'#111', marginBottom:'35px', fontWeight:'800'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h1>
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const email = `${celular.replace(/\D/g, '')}@klinni.ia`; 
              try { await signInWithEmailAndPassword(auth, email, password); } 
              catch(err){ alert("Erro no login."); } 
            }} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <button style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'600'}}>ENTRAR</button>
            </form>
            <div style={{marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
              <button onClick={() => alert("Cadastro em breve.")} style={{background: 'none', border: 'none', color: '#ff6b00', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>CRIAR CONTA</button>
              <button onClick={() => alert("Fale com suporte.")} style={{background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer'}}>Esqueci minha chave</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom:'1px solid #f0f0f0', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, color:'#111', fontSize:'20px', fontWeight:'900'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h2>
            <div style={{display:'flex', gap:'35px', alignItems: 'center'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='dashboard'?'#ff6b00':'#888'}}>DASHBOARD</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='novoLead'?'#ff6b00':'#888'}}>+ NOVO LEAD</button>
              <button onClick={()=>signOut(auth)} style={{color:'#ccc', border:'1px solid #eee', background:'white', padding: '8px 16px', borderRadius: '10px', fontSize:'11px', fontWeight:'bold'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' && (
              <>
                {/* CALENDÁRIO DE AGENDADOS (TOP) */}
                <div style={{marginBottom: '40px'}}>
                  <h3 style={{fontSize: '14px', color: '#111', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px'}}>Próximos Agendamentos</h3>
                  <div style={{display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px'}}>
                    {getProximosDias().map((dia, idx) => (
                      <div key={idx} style={{minWidth: '160px', background: idx === 0 ? '#fff7ed' : 'white', border: idx === 0 ? '1px solid #ff6b00' : '1px solid #f0f0f0', borderRadius: '20px', padding: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize: '10px', color: idx === 0 ? '#ff6b00' : '#aaa', fontWeight: '800', marginBottom: '8px'}}>{dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}</div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                          {leadsAgendados.length > 0 ? (
                            leadsAgendados.slice(0, 2).map(l => (
                              <div key={l.id} style={{fontSize: '11px', background: '#1a1a1a', color: 'white', padding: '6px 10px', borderRadius: '8px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                {l.nome.split(' ')[0]}
                              </div>
                            ))
                          ) : (
                            <div style={{fontSize: '10px', color: '#eee'}}>Vazio</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAROL */}
                <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fff7ed', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff6b00'}}>
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M7 15h0M2 9.5h20"/></svg>
                    </div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Pendente</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalPendente)}</div>
                    </div>
                  </div>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fffbeb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                    </div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Em Atendimento</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalAtendimento)}</div>
                    </div>
                  </div>
                </div>

                {/* LISTA DE LEADS */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                  {leads.map(l => {
                    const styleOrigem = getStyleOrigem(l.origem);
                    const styleStatus = getStyleStatus(l.status);
                    return (
                      <div key={l.id} style={{background:'#ffffff', padding:'32px', borderRadius:'24px', position:'relative', border:'1px solid #f5f5f5'}}>
                        <div style={{position:'absolute', right:'24px', top:'24px', display:'flex', gap:'8px'}}>
                          <ActionButton onClick={() => iniciarEdicao(l)} hoverColor="#ff6b00">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                          </ActionButton>
                          <ActionButton onClick={async () => { if(window.confirm("Apagar?")) await deleteDoc(doc(db, "leads", l.id)); }} hoverColor="#ef4444">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </ActionButton>
                        </div>
                        <h4 style={{margin:'0 0 15px 0', fontSize:'18px', color:'#1a1a1a', fontWeight:'700'}}>{l.nome}</h4>
                        <div style={{display:'flex', gap:'8px', marginBottom: '20px'}}>
                          <span style={{fontSize:'10px', background: styleStatus.bg, color: styleStatus.color, padding:'5px 12px', borderRadius:'10px', fontWeight:'700'}}>{l.status}</span>
                          <span style={{fontSize:'10px', background: styleOrigem.bg, color: styleOrigem.color, padding:'5px 12px', borderRadius:'10px', fontWeight:'700'}}>{l.origem}</span>
                        </div>
                        <div style={{borderTop: '1px solid #f9f9f9', paddingTop: '15px'}}>
                          <div style={{fontSize: '10px', color: '#aaa', fontWeight: 'bold'}}>VALOR ESTIMADO</div>
                          <div style={{fontSize:'18px', color:'#1a1a1a', fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {view === 'novoLead' && (
              <div style={{maxWidth:'500px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'32px', border: '1px solid #f5f5f5'}}>
                <h2 style={{marginBottom:'30px', textAlign:'center', fontWeight:'800'}}>{idLeadEditando ? 'Refinar' : 'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
                  <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
                  <div style={{display:'flex', gap:'10px'}}>
                    <input type="number" placeholder="R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}}>
                      <option value="Pendente">Pendente</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Em atendimento">Em atendimento</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'16px', fontWeight:'700', cursor: 'pointer'}}>
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
