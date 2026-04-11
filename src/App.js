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
  
  // States Form
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

  // --- LÓGICA DE CALENDÁRIO ---
  const getProximosDias = () => {
    const dias = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(); d.setDate(d.getDate() + i);
      dias.push(d);
    }
    return dias;
  };

  // --- CORES E ESTILOS (RESTAURADOS) ---
  const getOrigemStyle = (origem) => {
    switch (origem) {
      case 'Facebook': return { bg: '#f0f9ff', color: '#0369a1' };
      case 'Google': return { bg: '#fdf2f8', color: '#be185d' };
      case 'Site': return { bg: '#fff7ed', color: '#c2410c' };
      case 'Instagram': return { bg: '#f5f3ff', color: '#6d28d9' };
      default: return { bg: '#f8fafc', color: '#4b5563' };
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Agendado': return { bg: '#eff6ff', color: '#1d4ed8' };
      case 'Em atendimento': return { bg: '#fffbeb', color: '#b45309' };
      case 'Não qualificado': return { bg: '#f9fafb', color: '#6b7280' };
      case 'Pendente': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f8fafc', color: '#475569' };
    }
  };

  // --- RELATÓRIO FINANCEIRO (Pendente, Em Atendimento, Agendado) ---
  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAgendado = leads.filter(l => l.status === 'Agendado').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Lógica de Segmentação Inteligente (Filtro de Salvador)
    const idade = nascimentoLead ? new Date().getFullYear() - new Date(nascimentoLead).getFullYear() : 0;
    const bairrosNobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (bairrosNobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";

    const dados = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      origem: origemLead, sexo: sexoLead, valorOrcamento: parseFloat(valorOrcamento) || 0, 
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
    setNascimentoLead(l.dataNascimento); setOrigemLead(l.origem);
    setSexoLead(l.sexo || 'Não Informado'); setValorOrcamento(l.valorOrcamento || '');
    setStatusLead(l.status || 'Pendente'); setObsLead(l.observacoes || '');
    setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setOrigemLead('Instagram'); setSexoLead('Não Informado'); setValorOrcamento('');
    setStatusLead('Pendente'); setObsLead('');
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#ff6b00', fontWeight: '300'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '"Inter", sans-serif' }}>
      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
           <div style={{width:'350px', padding:'50px', textAlign:'center', border:'1px solid #f2f2f2', borderRadius:'32px'}}>
            <h1 style={{fontSize:'28px', color:'#111', marginBottom:'35px', fontWeight:'800'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h1>
            <form onSubmit={async (e) => { e.preventDefault(); const email = `${celular.replace(/\D/g, '')}@klinni.ia`; try { await signInWithEmailAndPassword(auth, email, password); } catch(err){alert("Credenciais inválidas.");} }} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <button style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'600', cursor:'pointer'}}>ENTRAR</button>
            </form>
            <div style={{marginTop:'25px', display:'flex', flexDirection:'column', gap:'12px'}}>
               <button onClick={()=>alert("Cadastro em breve.")} style={{background:'none', border:'none', color:'#ff6b00', fontSize:'13px', fontWeight:'700', cursor:'pointer'}}>CRIAR NOVA CONTA</button>
               <button onClick={()=>alert("Contate o suporte.")} style={{background:'none', border:'none', color:'#aaa', fontSize:'12px', cursor:'pointer'}}>Esqueci minha chave</button>
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
              <button onClick={()=>signOut(auth)} style={{color:'#ccc', border:'1px solid #eee', background:'white', padding: '8px 16px', borderRadius: '10px', fontSize:'11px', fontWeight:'bold', cursor:'pointer'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' && (
              <>
                {/* CALENDÁRIO HORIZONTAL NO TOPO */}
                <div style={{marginBottom: '40px'}}>
                  <h3 style={{fontSize: '11px', color: '#111', fontWeight: '900', marginBottom: '15px', textTransform: 'uppercase', letterSpacing: '1px'}}>Minha Agenda</h3>
                  <div style={{display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px'}}>
                    {getProximosDias().map((dia, idx) => (
                      <div key={idx} style={{minWidth: '150px', background: idx === 0 ? '#fff7ed' : 'white', border: idx === 0 ? '1px solid #ff6b00' : '1px solid #f2f2f2', borderRadius: '18px', padding: '16px'}}>
                        <div style={{fontSize: '10px', color: idx === 0 ? '#ff6b00' : '#bbb', fontWeight: '800', marginBottom: '10px'}}>{dia.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}</div>
                        <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
                          {leads.filter(l => l.status === 'Agendado').slice(0,2).map(l => (
                            <div key={l.id} style={{fontSize:'10px', background:'#1a1a1a', color:'white', padding:'5px 8px', borderRadius:'6px', fontWeight:'700'}}>{l.nome.split(' ')[0]}</div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* FAROL ESTRATÉGICO COMPLETO */}
                <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '40px', height: '40px', background: '#fff7ed', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg></div>
                    <div style={{marginLeft: '15px'}}>
                      <div style={{fontSize: '10px', color: '#aaa', fontWeight: '800'}}>PENDENTE</div>
                      <div style={{fontSize: '18px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalPendente)}</div>
                    </div>
                  </div>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '40px', height: '40px', background: '#eff6ff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1d4ed8'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                    <div style={{marginLeft: '15px'}}>
                      <div style={{fontSize: '10px', color: '#aaa', fontWeight: '800'}}>AGENDADO</div>
                      <div style={{fontSize: '18px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalAgendado)}</div>
                    </div>
                  </div>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '40px', height: '40px', background: '#fffbeb', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309'}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg></div>
                    <div style={{marginLeft: '15px'}}>
                      <div style={{fontSize: '10px', color: '#aaa', fontWeight: '800'}}>ATENDIMENTO</div>
                      <div style={{fontSize: '18px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalAtendimento)}</div>
                    </div>
                  </div>
                </div>

                {/* LISTAGEM DE LEADS */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                  {leads.map(l => {
                    const styleOrigem = getOrigemStyle(l.origem);
                    const styleStatus = getStatusStyle(l.status);
                    return (
                      <div key={l.id} style={{background:'#ffffff', padding:'32px', borderRadius:'24px', position:'relative', border:'1px solid #f5f5f5'}}>
                        <div style={{position:'absolute', right:'24px', top:'24px', display:'flex', gap:'8px'}}>
                          <ActionButton onClick={() => iniciarEdicao(l)} hoverColor="#ff6b00"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"/></svg></ActionButton>
                          <ActionButton onClick={async () => { if(window.confirm("Apagar?")) await deleteDoc(doc(db, "leads", l.id)); }} hoverColor="#ef4444"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></ActionButton>
                        </div>
                        <div style={{display:'flex', gap:'8px', marginBottom:'15px', alignItems:'center'}}>
                            <span style={{fontSize:'9px', fontWeight:'800', color: l.categoria === 'HIGH TICKET' ? '#b45309' : '#999'}}>{l.categoria}</span>
                        </div>
                        <h4 style={{margin:'0 0 15px 0', fontSize:'18px', color:'#1a1a1a', fontWeight:'700'}}>{l.nome}</h4>
                        <div style={{display:'flex', gap:'10px', marginBottom: '20px'}}>
                          <span style={{fontSize:'10px', background: styleStatus.bg, color: styleStatus.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700'}}>{l.status}</span>
                          <span style={{fontSize:'10px', background: styleOrigem.bg, color: styleOrigem.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700'}}>{l.origem}</span>
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
              <div style={{maxWidth:'550px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'32px', border:'1px solid #f5f5f5'}}>
                <h2 style={{marginBottom:'40px', textAlign:'center', fontWeight:'800'}}>{idLeadEditando ? 'Refinar' : 'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
                  <div style={{display:'flex', gap:'15px'}}>
                    <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                  </div>
                  <div style={{display:'flex', gap:'15px'}}>
                    <input type="number" step="0.01" placeholder="Orçamento R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1, background:'white'}}>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Google">Google</option>
                      <option value="Site">Site</option>
                    </select>
                  </div>
                  <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', background:'white'}}>
                    <option value="Pendente">Pendente</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Em atendimento">Em atendimento</option>
                    <option value="Não qualificado">Não qualificado</option>
                  </select>
                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'16px', fontWeight:'700', cursor:'pointer'}}>
                    {isSaving ? 'PROCESSANDO...' : 'CONFIRMAR'}
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
