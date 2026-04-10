import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- ÍCONES SVG ---
const IconPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconCake = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', marginLeft: '10px' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const IconEdit = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
  </svg>
);

const IconTrash = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>
);

// --- CONFIGURAÇÃO OFICIAL KLINNI IA ---
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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Agendado': return { bg: '#2563eb', color: '#fff' };
      case 'Em atendimento': return { bg: '#eab308', color: '#000' };
      case 'Não qualificado': return { bg: '#4b5563', color: '#fff' };
      case 'Pendente': return { bg: '#f97316', color: '#fff' };
      default: return { bg: '#94a3b8', color: '#fff' };
    }
  };

  const getOrigemStyle = (origem) => {
    switch (origem) {
      case 'Facebook': return { bg: '#0369a1', color: '#fff' };
      case 'Google': return { bg: '#be185d', color: '#fff' };
      case 'Site': return { bg: '#c2410c', color: '#fff' };
      case 'Instagram': return { bg: '#6d28d9', color: '#fff' };
      default: return { bg: '#4b5563', color: '#fff' };
    }
  };

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    const emailFake = `${celular.replace(/\D/g, '')}@klinni.ia`;
    try { await signInWithEmailAndPassword(auth, emailFake, password); } catch (err) { alert("Erro de acesso."); }
  };

  const handleExcluirLead = async (id, nome) => {
    if (window.confirm(`Excluir permanentemente o lead ${nome}?`)) {
      await deleteDoc(doc(db, "leads", id));
      mostrarMensagem("Excluído!");
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
        mostrarMensagem("Atualizado!");
      } else {
        await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() });
        mostrarMensagem("Salvo!");
      }
      resetForm();
      setTimeout(() => { setView('dashboard'); setIsSaving(false); }, 1000);
    } catch (err) { setIsSaving(false); }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center', color:'#ff6b00', fontWeight:'bold'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' }}>
      
      {aviso.visivel && (
        <div style={{ position: 'fixed', top: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, background: '#22c55e', color: 'white', padding: '12px 24px', borderRadius: '50px', fontWeight: 'bold', boxShadow:'0 4px 12px rgba(0,0,0,0.1)' }}>
          {aviso.texto}
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
          <div style={{width:'320px', padding:'40px', textAlign:'center', border:'1px solid #f0f0f0', borderRadius:'24px'}}>
            <h1 style={{fontSize:'32px', color:'#ff6b00', marginBottom:'25px', fontWeight:'900'}}>KLINNI IA</h1>
            <form onSubmit={handleAutenticacao} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'2px solid #eee'}} />
              <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:'14px', borderRadius:'12px', border:'2px solid #eee'}} />
              <button style={{padding:'14px', background:'#ff6b00', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer'}}>ENTRAR</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 40px', background:'white', alignItems:'center', borderBottom:'2px solid #ff6b00', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, color:'#ff6b00', fontSize:'22px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300', color:'#333'}}>IA</span></h2>
            <div style={{display:'flex', gap:'25px'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='dashboard'?'#ff6b00':'#333'}}>Dashboard</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='novoLead'?'#ff6b00':'#333'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'#999', border:'none', background:'none', cursor:'pointer', fontSize:'13px'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'35px 40px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
                {leads.map(l => {
                  const styleOrigem = getOrigemStyle(l.origem);
                  const styleStatus = getStatusStyle(l.status);
                  return (
                    <div key={l.id} style={{background:'white', padding:'25px', borderRadius:'20px', borderLeft: l.categoria === 'HIGH TICKET' ? '8px solid #ffb300' : '8px solid #ff6b00', position:'relative', boxShadow:'0 6px 18px rgba(0,0,0,0.06)'}}>
                      
                      <div style={{position:'absolute', right:'18px', top:'20px', display:'flex', gap:'12px'}}>
                        <button onClick={() => iniciarEdicao(l)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer', padding: '4px'}}><IconEdit /></button>
                        <button onClick={() => handleExcluirLead(l.id, l.nome)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer', padding: '4px'}}><IconTrash /></button>
                      </div>

                      <div style={{display:'flex', gap:'8px', marginBottom:'15px', alignItems:'center', flexWrap:'wrap'}}>
                          <span style={{fontSize:'9px', fontWeight:'900', color: l.categoria === 'HIGH TICKET' ? '#ffb300' : '#ff6b00', border:`1.5px solid ${l.categoria === 'HIGH TICKET' ? '#ffb300' : '#ff6b00'}`, padding:'3px 8px', borderRadius:'6px', textTransform:'uppercase'}}>{l.categoria}</span>
                          
                          {/* TAG STATUS - REFINADA */}
                          <span style={{fontSize:'10px', background: styleStatus.bg, color: styleStatus.color, padding:'4px 12px', borderRadius:'8px', fontWeight:'900', textTransform: 'uppercase', letterSpacing:'0.5px'}}>
                            {l.status || 'Pendente'}
                          </span>

                          {/* TAG ORIGEM - AUMENTADA CONFORME SOLICITADO */}
                          <span style={{fontSize:'10px', background: styleOrigem.bg, color: styleOrigem.color, padding:'4px 12px', borderRadius:'8px', fontWeight:'800', textTransform: 'uppercase', letterSpacing:'0.5px', border: '1px solid rgba(0,0,0,0.05)'}}>
                            {l.origem}
                          </span>
                      </div>
                      
                      <h4 style={{margin:'0 0 6px 0', fontSize:'20px', color:'#111', fontWeight:'800', maxWidth:'75%'}}>{l.nome}</h4>
                      
                      <div style={{display:'flex', alignItems:'center', fontSize:'13px', color:'#666', marginBottom: '15px'}}>
                        <div style={{display:'flex', alignItems:'center'}}><IconPin /><span>{l.cep}</span></div>
                        <div style={{display:'flex', alignItems:'center'}}><IconCake /><span>{new Date(l.dataNascimento).toLocaleDateString('pt-BR')}</span></div>
                      </div>

                      {l.valorOrcamento > 0 && (
                        <div style={{fontSize:'18px', color:'#16a34a', fontWeight:'900', marginBottom: '12px'}}>
                          R$ {formatarMoeda(l.valorOrcamento)}
                        </div>
                      )}

                      {l.observacoes && (
                        <div style={{marginTop:'12px', background:'#f9fafb', padding:'10px 14px', borderRadius:'10px', fontSize:'12px', color:'#4b5563', borderLeft:'4px solid #ddd', fontStyle:'italic', lineHeight:'1.5'}}>
                          {l.observacoes}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{maxWidth:'500px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'28px', boxShadow:'0 15px 35px rgba(0,0,0,0.06)'}}>
                <h2 style={{marginBottom:'30px', color:'#333', textAlign:'center', fontWeight:'900', fontSize:'22px'}}>{idLeadEditando ? 'Editar Lead' : 'Novo Cadastro'}</h2>
                
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Nome do Lead</label>
                  <input placeholder="Ex: João Silva" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', fontSize:'14px'}} />
                  
                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>CEP</label>
                      <input placeholder="00000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', fontSize:'14px'}} />
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Nascimento</label>
                      <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', fontSize:'14px'}} />
                    </div>
                  </div>

                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Sexo</label>
                      <select value={sexoLead} onChange={e=>setSexoLead(e.target.value)} style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', background:'white', fontSize:'14px'}}>
                        <option value="Não Informado">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Orçamento (R$)</label>
                      <input type="number" step="0.01" placeholder="0.00" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', fontSize:'14px'}} />
                    </div>
                  </div>

                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Origem</label>
                      <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', background:'white', fontSize:'14px'}}>
                        <option value="Instagram">Instagram</option>
                        <option value="Site">Site</option>
                        <option value="Google">Google</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>
                    <div style={{flex:1}}>
                      <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Status Funil</label>
                      <select value={statusLead} onChange={e=>setStatusLead(e.target.value)} style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', width:'100%', background:'white', fontSize:'14px', fontWeight:'bold'}}>
                        <option value="Agendado">Agendado</option>
                        <option value="Em atendimento">Em atendimento</option>
                        <option value="Não qualificado">Não qualificado</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </div>

                  <label style={{fontSize:'13px', fontWeight:'bold', color:'#555'}}>Observações</label>
                  <textarea placeholder="Detalhes extras..." value={obsLead} onChange={e=>setObsLead(e.target.value)} style={{padding:'12px', borderRadius:'10px', border:'2px solid #f0f0f0', height:'80px', resize:'none', fontSize:'14px'}} />

                  <button type="submit" disabled={isSaving} style={{padding:'16px', background:'#ff6b00', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'16px', cursor:'pointer', marginTop:'10px'}}>
                    {isSaving ? 'Gravando...' : idLeadEditando ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR NO FUNIL'}
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
