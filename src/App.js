import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- ÍCONES PREMIUM COM LOGICA DE HOVER ---
const IconWallet = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', opacity: 0.6 }}>
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"></path>
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"></path>
    <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"></path>
  </svg>
);

const IconTrend = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', opacity: 0.6 }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconCake = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', marginLeft: '12px' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" ry="2"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

// --- COMPONENTES DE AÇÃO REATIVOS ---
const ActionButton = ({ onClick, children, hoverColor }) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button 
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'none',
        border: 'none',
        color: isHovered ? hoverColor : '#ddd',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        padding: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {children}
    </button>
  );
};

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

  const [aviso, setAviso] = useState({ visivel: false, texto: '' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Cálculos do Farol
  const totalPendente = leads.filter(l => l.status === 'Pendente').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);
  const totalAtendimento = leads.filter(l => l.status === 'Em atendimento').reduce((acc, curr) => acc + (parseFloat(curr.valorOrcamento) || 0), 0);

  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const idade = new Date().getFullYear() - new Date(nascimentoLead).getFullYear();
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    const dados = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      origem: origemLead, sexo: sexoLead, valorOrcamento: parseFloat(valorOrcamento) || 0, 
      status: statusLead, observacoes: obsLead, categoria, userId: user.uid, updatedAt: serverTimestamp()
    };

    try {
      if (idLeadEditando) { await updateDoc(doc(db, "leads", idLeadEditando), dados); }
      else { await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() }); }
      resetForm();
      setView('dashboard');
    } finally { setIsSaving(false); }
  };

  const iniciarEdicao = (lead) => {
    setIdLeadEditando(lead.id); setNomeLead(lead.nome); setCepLead(lead.cep);
    setNascimentoLead(lead.dataNascimento); setOrigemLead(lead.origem);
    setSexoLead(lead.sexo || 'Não Informado'); setValorOrcamento(lead.valorOrcamento || '');
    setStatusLead(lead.status || 'Pendente'); setObsLead(lead.observacoes || '');
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
            <form onSubmit={async (e) => { e.preventDefault(); const email = `${celular.replace(/\D/g, '')}@klinni.ia`; try { await signInWithEmailAndPassword(auth, email, password); } catch(err){alert("Erro");} }} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee'}} />
              <button style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'600'}}>ENTRAR</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom:'1px solid #f0f0f0', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, color:'#111', fontSize:'20px', fontWeight:'900'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h2>
            <div style={{display:'flex', gap:'35px', alignItems: 'center'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='dashboard'?'#ff6b00':'#888'}}>DASHBOARD</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='novoLead'?'#ff6b00':'#888'}}>+ NOVO LEAD</button>
              <button onClick={()=>signOut(auth)} style={{color:'#ccc', border:'1px solid #eee', background:'white', padding: '8px 16px', borderRadius: '10px', fontSize:'11px'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' && (
              <>
                <div style={{display: 'flex', gap: '20px', marginBottom: '40px'}}>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fff7ed', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c'}}><IconWallet /></div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Pendente</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalPendente)}</div>
                    </div>
                  </div>
                  <div style={{flex: 1, background: 'white', padding: '24px', borderRadius: '24px', border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center'}}>
                    <div style={{width: '48px', height: '48px', background: '#fffbeb', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b45309'}}><IconTrend /></div>
                    <div style={{marginLeft: '20px'}}>
                      <div style={{fontSize: '11px', color: '#aaa', fontWeight: '800', textTransform: 'uppercase'}}>Em Atendimento</div>
                      <div style={{fontSize: '22px', color: '#1a1a1a', fontWeight: '800'}}>R$ {formatarMoeda(totalAtendimento)}</div>
                    </div>
                  </div>
                </div>

                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                  {leads.map(l => (
                    <div key={l.id} style={{background:'#ffffff', padding:'32px', borderRadius:'24px', position:'relative', boxShadow:'0 4px 20px rgba(0,0,0,0.02)', border:'1px solid #f5f5f5'}}>
                      
                      {/* ÁREA DE AÇÕES REATIVAS */}
                      <div style={{position:'absolute', right:'24px', top:'24px', display:'flex', gap:'8px'}}>
                        <ActionButton onClick={() => iniciarEdicao(l)} hoverColor="#ff6b00">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
                        </ActionButton>
                        <ActionButton onClick={async () => { if(window.confirm("Apagar?")) await deleteDoc(doc(db, "leads", l.id)); }} hoverColor="#ef4444">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </ActionButton>
                      </div>

                      <div style={{display:'flex', gap:'8px', marginBottom:'20px', alignItems:'center'}}>
                          <span style={{fontSize:'9px', fontWeight:'700', color: l.categoria === 'HIGH TICKET' ? '#b45309' : '#64748b'}}>{l.categoria}</span>
                          <span style={{fontSize:'9px', color: '#ccc'}}>•</span>
                          <span style={{fontSize:'9px', fontWeight:'700', color: '#999'}}>{l.createdAt ? new Date(l.createdAt.toDate()).toLocaleDateString('pt-BR') : '--'}</span>
                      </div>
                      
                      <h4 style={{margin:'0 0 8px 0', fontSize:'20px', color:'#1a1a1a', fontWeight:'700'}}>{l.nome}</h4>
                      <div style={{display:'flex', alignItems:'center', fontSize:'12px', color:'#888', marginBottom: '25px'}}>
                        <IconPin /><span>{l.cep}</span>
                        <IconCake /><span>{new Date(l.dataNascimento).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <div style={{display:'flex', gap:'10px', marginBottom: '25px'}}>
                        <span style={{fontSize:'10px', background: '#f8fafc', color: '#475569', padding:'6px 14px', borderRadius:'12px', fontWeight:'700'}}>{l.status}</span>
                        <span style={{fontSize:'10px', background: '#f8fafc', color: '#475569', padding:'6px 14px', borderRadius:'12px', fontWeight:'700'}}>{l.origem}</span>
                      </div>

                      <div style={{borderTop: '1px solid #f9f9f9', paddingTop: '20px'}}>
                        <div style={{fontSize: '10px', color: '#aaa', fontWeight: 'bold', marginBottom: '4px'}}>VALOR ESTIMADO</div>
                        <div style={{fontSize:'20px', color:'#1a1a1a', fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {view === 'novoLead' && (
              <div style={{maxWidth:'550px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'32px', border: '1px solid #f5f5f5'}}>
                <h2 style={{marginBottom:'40px', color:'#111', textAlign:'center', fontWeight:'800'}}>{idLeadEditando ? 'Editar' : 'Novo'} Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', outline:'none'}} />
                  <div style={{display:'flex', gap:'20px'}}>
                    <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                  </div>
                  <div style={{display:'flex', gap:'20px'}}>
                    <input type="number" step="0.01" placeholder="R$" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1}} />
                    <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', flex:1, background:'white'}}>
                      <option value="Agendado">Agendado</option>
                      <option value="Em atendimento">Em atendimento</option>
                      <option value="Não qualificado">Não qualificado</option>
                      <option value="Pendente">Pendente</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'16px', fontWeight:'700'}}>
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
