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
  
  // States Auth & Form
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

  // --- ESTILIZAÇÃO DINÂMICA ---
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

  // --- CÁLCULOS E FORMATAÇÃO ---
  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const formatarMoeda = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(v);

  // --- AÇÕES ---
  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Lógica High Ticket (Salvador)
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
      
      {/* TELA DE LOGIN RESTAURADA */}
      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
           <div style={{width:'350px', padding:'50px', textAlign:'center', border:'1px solid #f2f2f2', borderRadius:'32px', boxShadow: '0 20px 50px rgba(0,0,0,0.02)'}}>
            <h1 style={{fontSize:'28px', color:'#111', marginBottom:'35px', fontWeight:'800'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h1>
            
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const email = `${celular.replace(/\D/g, '')}@klinni.ia`; 
              try { await signInWithEmailAndPassword(auth, email, password); } 
              catch(err){ alert("Chave ou celular incorretos."); } 
            }} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', outline: 'none'}} />
              <input type="password" placeholder="Chave de Acesso" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', outline: 'none'}} />
              <button style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'600', cursor:'pointer', marginTop: '10px'}}>ENTRAR</button>
            </form>

            <div style={{marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <button onClick={() => alert("Função de cadastro em breve.")} style={{background: 'none', border: 'none', color: '#ff6b00', fontSize: '13px', fontWeight: '700', cursor: 'pointer'}}>CRIAR NOVA CONTA</button>
              <button onClick={() => alert("Contate o suporte para redefinir sua chave.")} style={{background: 'none', border: 'none', color: '#aaa', fontSize: '12px', fontWeight: '500', cursor: 'pointer'}}>Esqueci minha chave</button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* HEADER DASHBOARD */}
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
                {/* FAROL DE VALORES */}
                <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fff7ed', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c'}}>
                       <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path></svg>
                    </div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Pendente</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalPendente)}</div>
                    </div>
                  </div>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fffbeb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309'}}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    </div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Em Atendimento</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalAtendimento)}</div>
                    </div>
                  </div>
                </div>

                {/* GRID DE LEADS */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                  {leads.map(l => {
                    const styleOrigem = getOrigemStyle(l.origem);
                    const styleStatus = getStatusStyle(l.status);
                    return (
                      <div key={l.id} style={{background:'#ffffff', padding:'32px', borderRadius:'24px', position:'relative', boxShadow:'0 4px 20px rgba(0,0,0,0.02)', border:'1px solid #f5f5f5'}}>
                        
                        {/* AÇÕES COM HOVER REATIVO */}
                        <div style={{position:'absolute', right:'24px', top:'24px', display:'flex', gap:'8px'}}>
                          <ActionButton onClick={() => iniciarEdicao(l)} hoverColor="#ff6b00">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                          </ActionButton>
                          <ActionButton onClick={async () => { if(window.confirm("Apagar lead?")) await deleteDoc(doc(db, "leads", l.id)); }} hoverColor="#ef4444">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </ActionButton>
                        </div>

                        <div style={{display:'flex', gap:'8px', marginBottom:'20px', alignItems:'center'}}>
                            <span style={{fontSize:'9px', fontWeight:'700', color: l.categoria === 'HIGH TICKET' ? '#b45309' : '#64748b', letterSpacing:'0.5px'}}>{l.categoria}</span>
                            <span style={{fontSize:'9px', color: '#ccc'}}>•</span>
                            <span style={{fontSize:'9px', fontWeight:'700', color: '#999'}}>{l.createdAt ? new Date(l.createdAt.toDate()).toLocaleDateString('pt-BR') : '--'}</span>
                        </div>
                        
                        <h4 style={{margin:'0 0 8px 0', fontSize:'20px', color:'#1a1a1a', fontWeight:'700'}}>{l.nome}</h4>
                        
                        <div style={{display:'flex', gap:'10px', margin: '20px 0'}}>
                          <span style={{fontSize:'10px', background: styleStatus.bg, color: styleStatus.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700', textTransform: 'uppercase'}}>{l.status || 'Pendente'}</span>
                          <span style={{fontSize:'10px', background: styleOrigem.bg, color: styleOrigem.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700', textTransform: 'uppercase'}}>{l.origem}</span>
                        </div>

                        <div style={{borderTop: '1px solid #f9f9f9', paddingTop: '20px'}}>
                          <div style={{fontSize: '10px', color: '#aaa', fontWeight: 'bold', marginBottom: '4px'}}>ORÇAMENTO ESTIMADO</div>
                          <div style={{fontSize:'20px', color:'#1a1a1a', fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* FORMULÁRIO DE CADASTRO/EDIÇÃO */}
            {view === 'novoLead' && (
              <div style={{maxWidth:'550px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'32px', border: '1px solid #f5f5f5', boxShadow: '0 20px 40px rgba(0,0,0,0.04)'}}>
                <h2 style={{marginBottom:'40px', color:'#111', textAlign:'center', fontWeight:'800'}}>{idLeadEditando ? 'Refinar' : 'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <input placeholder="Nome Completo" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', outline:'none'}} />
                  <div style={{display:'flex', gap:'20px'}}>
                    <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                  </div>
                  <div style={{display:'flex', gap:'20px'}}>
                    <input type="number" step="0.01" placeholder="Orçamento R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1, background:'white'}}>
                      <option value="Instagram">Instagram</option>
                      <option value="Facebook">Facebook</option>
                      <option value="Google">Google</option>
                      <option value="Site">Site</option>
                    </select>
                  </div>
                  <div style={{display:'flex', gap:'20px'}}>
                    <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1, background:'white', fontWeight:'bold'}}>
                      <option value="Agendado">Agendado</option>
                      <option value="Em atendimento">Em atendimento</option>
                      <option value="Não qualificado">Não qualificado</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                    <select value={sexoLead} onChange={e=>setSexoLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1, background:'white'}}>
                      <option value="Não Informado">Gênero...</option>
                      <option value="Masculino">Masculino</option>
                      <option value="Feminino">Feminino</option>
                    </select>
                  </div>
                  <textarea placeholder="Observações..." value={obsLead} onChange={e=>setObsLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', minHeight:'100px', fontFamily:'inherit'}} />
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
