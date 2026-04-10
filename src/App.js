import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- ÍCONES ELEGANTES ---
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
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
  </svg>
);

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// --- CONFIGURAÇÃO ---
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

  const mostrarMensagem = (txt) => {
    setAviso({ visivel: true, texto: txt });
    setTimeout(() => setAviso({ visivel: false, texto: '' }), 3000);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
  };

  // --- PALETA DE CORES PREMIUM (SOFT) ---
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Agendado': return { bg: '#eff6ff', color: '#1d4ed8' };
      case 'Em atendimento': return { bg: '#fffbeb', color: '#b45309' };
      case 'Não qualificado': return { bg: '#f9fafb', color: '#6b7280' };
      case 'Pendente': return { bg: '#fff7ed', color: '#c2410c' };
      default: return { bg: '#f8fafc', color: '#475569' };
    }
  };

  const getOrigemStyle = (origem) => {
    switch (origem) {
      case 'Facebook': return { bg: '#f0f9ff', color: '#0369a1' };
      case 'Google': return { bg: '#fdf2f8', color: '#be185d' };
      case 'Site': return { bg: '#fff7ed', color: '#c2410c' };
      case 'Instagram': return { bg: '#f5f3ff', color: '#6d28d9' };
      default: return { bg: '#f8fafc', color: '#4b5563' };
    }
  };

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    const emailFake = `${celular.replace(/\D/g, '')}@klinni.ia`;
    try { await signInWithEmailAndPassword(auth, emailFake, password); } catch (err) { alert("Acesso não autorizado."); }
  };

  const handleExcluirLead = async (id, nome) => {
    if (window.confirm(`Deseja remover o registro de ${nome}?`)) {
      await deleteDoc(doc(db, "leads", id));
      mostrarMensagem("Registro removido.");
    }
  };

  const iniciarEdicao = (lead) => {
    setIdLeadEditando(lead.id);
    setNomeLead(lead.nome);
    setCepLead(lead.cep);
    setNascimentoLead(lead.dataNascimento);
    setOrigemLead(lead.origem);
    setSexoLead(lead.sexo || 'Não Informado');
    setValorOrcamento(lead.valorOrcamento || '');
    setStatusLead(lead.status || 'Pendente');
    setObsLead(lead.observacoes || '');
    setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setCepLead(''); setNascimentoLead('');
    setOrigemLead('Instagram'); setSexoLead('Não Informado'); setValorOrcamento('');
    setStatusLead('Pendente'); setObsLead('');
  };

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
      if (idLeadEditando) {
        await updateDoc(doc(db, "leads", idLeadEditando), dados);
        mostrarMensagem("Dados refinados.");
      } else {
        await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() });
        mostrarMensagem("Lead imortalizado.");
      }
      resetForm();
      setTimeout(() => { setView('dashboard'); setIsSaving(false); }, 800);
    } catch (err) { setIsSaving(false); }
  };

  if (loading) return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', color: '#ff6b00', letterSpacing: '2px', fontWeight: '300'}}>CARREGANDO KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: '"Inter", sans-serif', color: '#333' }}>
      
      {aviso.visivel && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 99999, background: '#1a1a1a', color: 'white', padding: '16px 32px', borderRadius: '16px', fontWeight: '500', fontSize: '14px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
          {aviso.texto}
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
          <div style={{width:'350px', padding:'50px', textAlign:'center', border:'1px solid #f2f2f2', borderRadius:'32px', boxShadow: '0 20px 40px rgba(0,0,0,0.03)'}}>
            <h1 style={{fontSize:'28px', color:'#111', marginBottom:'35px', fontWeight:'800', letterSpacing:'-1px'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h1>
            <form onSubmit={handleAutenticacao} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
              <input placeholder="Acesso" value={celular} onChange={e=>setCelular(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', background: '#fcfcfc', outline: 'none'}} />
              <input type="password" placeholder="Chave" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #eee', background: '#fcfcfc', outline: 'none'}} />
              <button style={{padding:'18px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'14px', fontWeight:'600', cursor:'pointer', marginTop: '10px'}}>ACESSAR DASHBOARD</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', alignItems:'center', borderBottom:'1px solid #f0f0f0', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, color:'#111', fontSize:'20px', fontWeight:'900', letterSpacing:'-0.5px'}}>KLINNI <span style={{color:'#ff6b00'}}>IA</span></h2>
            <div style={{display:'flex', gap:'35px', alignItems: 'center'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='dashboard'?'#ff6b00':'#888', transition: '0.3s'}}>DASHBOARD</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: '600', color: view==='novoLead'?'#ff6b00':'#888', transition: '0.3s'}}>+ NOVO LEAD</button>
              <button onClick={()=>signOut(auth)} style={{color:'#ccc', border:'1px solid #eee', background:'white', cursor:'pointer', fontSize:'11px', padding: '8px 16px', borderRadius: '10px', fontWeight: 'bold'}}>SAIR</button>
            </div>
          </nav>

          <main style={{padding:'50px 60px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                {leads.map(l => {
                  const styleOrigem = getOrigemStyle(l.origem);
                  const styleStatus = getStatusStyle(l.status);
                  return (
                    <div key={l.id} style={{background:'#ffffff', padding:'32px', borderRadius:'24px', position:'relative', boxShadow:'0 4px 20px rgba(0,0,0,0.02)', border:'1px solid #f5f5f5', transition: 'transform 0.3s', cursor: 'default'}} onMouseEnter={(e)=>e.currentTarget.style.transform='translateY(-5px)'} onMouseLeave={(e)=>e.currentTarget.style.transform='translateY(0)'}>
                      
                      <div style={{position:'absolute', right:'24px', top:'24px', display:'flex', gap:'12px'}}>
                        <button onClick={() => iniciarEdicao(l)} style={{background:'none', border:'none', color:'#ddd', cursor:'pointer', transition: '0.2s'}} onMouseEnter={(e)=>e.target.style.color='#ff6b00'} onMouseLeave={(e)=>e.target.style.color='#ddd'}><IconEdit /></button>
                        <button onClick={() => handleExcluirLead(l.id, l.nome)} style={{background:'none', border:'none', color:'#ddd', cursor:'pointer', transition: '0.2s'}} onMouseEnter={(e)=>e.target.style.color='#ef4444'} onMouseLeave={(e)=>e.target.style.color='#ddd'}><IconTrash /></button>
                      </div>

                      <div style={{display:'flex', gap:'8px', marginBottom:'20px', alignItems:'center'}}>
                          <span style={{fontSize:'9px', fontWeight:'700', color: l.categoria === 'HIGH TICKET' ? '#b45309' : '#64748b', letterSpacing: '0.5px'}}>{l.categoria}</span>
                          <div style={{width: '4px', height: '4px', background: '#ddd', borderRadius: '50%'}}></div>
                          <span style={{fontSize:'9px', fontWeight:'700', color: '#999'}}>{new Date(l.createdAt?.toDate()).toLocaleDateString('pt-BR')}</span>
                      </div>
                      
                      <h4 style={{margin:'0 0 8px 0', fontSize:'20px', color:'#1a1a1a', fontWeight:'700', letterSpacing: '-0.3px'}}>{l.nome}</h4>
                      
                      <div style={{display:'flex', alignItems:'center', fontSize:'12px', color:'#888', marginBottom: '25px', fontWeight: '500'}}>
                        <IconPin /><span>{l.cep}</span>
                        <IconCake /><span>{new Date(l.dataNascimento).toLocaleDateString('pt-BR')}</span>
                      </div>

                      <div style={{display:'flex', gap:'10px', marginBottom: '25px'}}>
                        <span style={{fontSize:'10px', background: styleStatus.bg, color: styleStatus.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700', textTransform: 'uppercase', letterSpacing:'0.3px'}}>
                          {l.status || 'Pendente'}
                        </span>
                        <span style={{fontSize:'10px', background: styleOrigem.bg, color: styleOrigem.color, padding:'6px 14px', borderRadius:'12px', fontWeight:'700', textTransform: 'uppercase', letterSpacing:'0.3px'}}>
                          {l.origem}
                        </span>
                      </div>

                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', borderTop: '1px solid #f9f9f9', paddingTop: '20px'}}>
                        <div>
                          <div style={{fontSize: '10px', color: '#aaa', fontWeight: 'bold', marginBottom: '4px', textTransform: 'uppercase'}}>Orçamento Estimado</div>
                          <div style={{fontSize:'20px', color:'#111', fontWeight:'800'}}>R$ {formatarMoeda(l.valorOrcamento)}</div>
                        </div>
                      </div>

                      {l.observacoes && (
                        <div style={{marginTop:'20px', background:'#fafafa', padding:'14px', borderRadius:'14px', fontSize:'12px', color:'#666', lineHeight:'1.6', border: '1px solid #f0f0f0'}}>
                          {l.observacoes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{maxWidth:'550px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'32px', boxShadow:'0 30px 60px rgba(0,0,0,0.05)', border: '1px solid #f5f5f5'}}>
                <h2 style={{marginBottom:'40px', color:'#111', textAlign:'center', fontWeight:'800', fontSize:'24px', letterSpacing:'-0.5px'}}>{idLeadEditando ? 'Refinar Perfil' : 'Novo Lead Premium'}</h2>
                
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <div>
                    <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Identificação</label>
                    <input placeholder="Nome completo" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', fontSize:'15px', width:'100%', marginTop: '8px', outline: 'none'}} />
                  </div>
                  
                  <div style={{display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Localização (CEP)</label>
                      <input placeholder="00000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', fontSize:'15px', marginTop: '8px', outline: 'none'}} />
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Nascimento</label>
                      <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', fontSize:'15px', marginTop: '8px', outline: 'none'}} />
                    </div>
                  </div>

                  <div style={{display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Gênero</label>
                      <select value={sexoLead} onChange={e=>setSexoLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', background:'white', fontSize:'15px', marginTop: '8px', outline: 'none'}}>
                        <option value="Não Informado">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Potencial (R$)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', fontSize:'15px', marginTop: '8px', outline: 'none'}} />
                    </div>
                  </div>

                  <div style={{display:'flex', gap:'20px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Canal de Origem</label>
                      <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', background:'white', fontSize:'15px', marginTop: '8px', outline: 'none'}}>
                        <option value="Instagram">Instagram</option>
                        <option value="Site">Site</option>
                        <option value="Google">Google</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Etapa do Funil</label>
                      <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', width:'100%', background:'white', fontSize:'15px', marginTop: '8px', outline: 'none', fontWeight: 'bold'}}>
                        <option value="Agendado">Agendado</option>
                        <option value="Em atendimento">Em atendimento</option>
                        <option value="Não qualificado">Não qualificado</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{fontSize:'12px', fontWeight:'700', color:'#aaa', textTransform: 'uppercase', marginLeft: '4px'}}>Notas Estratégicas</label>
                    <textarea placeholder="Observações importantes sobre o lead..." value={obsLead} onChange={e=>setObsLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1.5px solid #eee', height:'100px', resize:'none', width:'100%', marginTop: '8px', fontSize:'14px', outline: 'none'}} />
                  </div>

                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:'#1a1a1a', color:'white', border:'none', borderRadius:'16px', fontWeight:'700', fontSize:'16px', cursor:'pointer', marginTop:'15px', transition: '0.3s'}} onMouseEnter={(e)=>e.target.style.background='#ff6b00'} onMouseLeave={(e)=>e.target.style.background='#1a1a1a'}>
                    {isSaving ? 'PROCESSANDO...' : idLeadEditando ? 'ATUALIZAR REGISTRO' : 'CONFIRMAR CADASTRO'}
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
