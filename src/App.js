import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- ÍCONES SVG MINIMALISTAS ---
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const IconCake = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', marginLeft: '12px' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path>
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
  const [modoRegistro, setModoRegistro] = useState(false);

  // States Formulário
  const [idLeadEditando, setIdLeadEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [nascimentoLead, setNascimentoLead] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
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
    setTimeout(() => setAviso({ visivel: false, texto: '' }), 3500);
  };

  const getOrigemStyle = (origem) => {
    switch (origem) {
      case 'Facebook': return { bg: 'rgba(3, 105, 161, 0.08)', color: '#0369a1', border: 'rgba(3, 105, 161, 0.2)' };
      case 'Google': return { bg: 'rgba(190, 24, 93, 0.08)', color: '#be185d', border: 'rgba(190, 24, 93, 0.2)' };
      case 'Site': return { bg: 'rgba(194, 65, 12, 0.08)', color: '#c2410c', border: 'rgba(194, 65, 12, 0.2)' };
      case 'Instagram': return { bg: 'rgba(109, 40, 217, 0.08)', color: '#6d28d9', border: 'rgba(109, 40, 217, 0.2)' };
      default: return { bg: 'rgba(75, 85, 99, 0.08)', color: '#4b5563', border: 'rgba(75, 85, 99, 0.2)' };
    }
  };

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    const numeroLimpo = celular.replace(/\D/g, '');
    const emailFake = `${numeroLimpo}@klinni.ia`;
    try {
      if (modoRegistro) {
        await createUserWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Acesso autorizado!");
      }
    } catch (err) {
      alert("Falha no acesso. Verifique os dados.");
    }
  };

  const iniciarEdicao = (lead) => {
    setIdLeadEditando(lead.id);
    setNomeLead(lead.nome);
    setCepLead(lead.cep);
    setNascimentoLead(lead.dataNascimento);
    setOrigemLead(lead.origem);
    setView('novoLead');
  };

  const resetForm = () => {
    setIdLeadEditando(null);
    setNomeLead('');
    setCepLead('');
    setNascimentoLead('');
    setOrigemLead('Instagram');
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const anoNasc = new Date(nascimentoLead).getFullYear();
    const anoAtual = new Date().getFullYear();
    const idade = anoAtual - anoNasc;
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    const dadosLead = {
      nome: nomeLead, cep: cepLead, dataNascimento: nascimentoLead,
      origem: origemLead, categoria, status: "ATUALIZADO", 
      userId: user.uid, updatedAt: serverTimestamp()
    };

    try {
      if (idLeadEditando) {
        await updateDoc(doc(db, "leads", idLeadEditando), dadosLead);
        mostrarMensagem("Lead atualizado com sucesso!");
      } else {
        await addDoc(collection(db, "leads"), { ...dadosLead, createdAt: serverTimestamp(), status: "NOVO LEAD" });
        mostrarMensagem("Novo lead cadastrado!");
      }
      resetForm();
      setTimeout(() => { setView('dashboard'); setIsSaving(false); }, 1500);
    } catch (err) {
      alert("Erro ao salvar.");
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center', color:'#ff6b00', fontWeight:'bold'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: 'sans-serif' }}>
      
      {aviso.visivel && (
        <div style={{ position: 'fixed', top: '25px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999, background: '#22c55e', color: 'white', padding: '14px 28px', borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>
          {aviso.texto}
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
          <div style={{width:'340px', padding:'40px', textAlign:'center', border:'1px solid #eee', borderRadius:'25px'}}>
            <h1 style={{fontSize:'36px', color:'#ff6b00', marginBottom:'5px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300', color:'#333'}}>IA</span></h1>
            <p style={{color:'#666', marginBottom:'30px'}}>Painel de Controle</p>
            <form onSubmit={handleAutenticacao} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #eee', fontSize:'16px'}} />
              <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #eee', fontSize:'16px'}} />
              <button style={{padding:'16px', background:'#ff6b00', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}}>
                {modoRegistro ? 'CRIAR CONTA' : 'ENTRAR'}
              </button>
            </form>
            <button onClick={() => setModoRegistro(!modoRegistro)} style={{marginTop:'25px', background:'none', border:'none', color:'#ff6b00', cursor:'pointer', fontWeight:'bold'}}>
              {modoRegistro ? 'Voltar' : 'Criar minha conta'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'white', alignItems:'center', borderBottom:'2px solid #ff6b00', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{margin:0, color:'#ff6b00', fontSize:'24px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300', color:'#333'}}>IA</span></h2>
            <div style={{display:'flex', gap:'30px'}}>
              <button onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='dashboard'?'#ff6b00':'#333'}}>Dashboard</button>
              <button onClick={()=>{ setView('novoLead'); resetForm(); }} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='novoLead'?'#ff6b00':'#333'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'#999', border:'none', background:'none', cursor:'pointer'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                {leads.map(l => {
                  const styleOrigem = getOrigemStyle(l.origem);
                  return (
                    <div key={l.id} style={{background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', borderLeft: l.categoria === 'HIGH TICKET' ? '8px solid #ffb300' : '8px solid #ff6b00', position:'relative'}}>
                      
                      <button 
                        onClick={() => iniciarEdicao(l)}
                        style={{position:'absolute', right:'20px', bottom:'20px', background:'none', border:'none', color:'#ccc', cursor:'pointer'}}
                        title="Editar Lead"
                      >
                        <IconEdit />
                      </button>

                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                          <span style={{fontSize:'10px', fontWeight:'900', color: l.categoria === 'HIGH TICKET' ? '#ffb300' : '#ff6b00', textTransform:'uppercase', letterSpacing: '1px'}}>{l.categoria}</span>
                          <span style={{
                            fontSize:'10px', 
                            background: styleOrigem.bg, 
                            color: styleOrigem.color, 
                            border: `1px solid ${styleOrigem.border}`,
                            padding:'3px 10px', 
                            borderRadius:'12px', 
                            fontWeight:'500', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.8px'
                          }}>{l.origem}</span>
                      </div>
                      <h4 style={{margin:'15px 0 10px 0', fontSize:'22px', color:'#333', fontWeight:'700'}}>{l.nome}</h4>
                      
                      <div style={{display:'flex', alignItems:'center', fontSize:'13px', color:'#666'}}>
                        <div style={{display:'flex', alignItems:'center', color: '#ff6b00'}}>
                          <IconPin />
                          <span style={{color: '#444'}}>{l.cep}</span>
                        </div>
                        <div style={{display:'flex', alignItems:'center', marginLeft: '8px'}}>
                          <IconCake />
                          <span style={{color: '#444'}}>{new Date(l.dataNascimento).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{maxWidth:'480px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'30px', boxShadow:'0 15px 35px rgba(0,0,0,0.08)'}}>
                <h2 style={{marginBottom:'10px', color:'#333', textAlign:'center', fontWeight:'900'}}>
                  {idLeadEditando ? 'Editar Perfil' : 'Novo Cadastro'}
                </h2>
                <p style={{textAlign:'center', color:'#999', marginBottom:'30px', fontSize:'14px'}}>
                  {idLeadEditando ? 'Altere as informações abaixo' : 'Preencha os dados do novo lead'}
                </p>
                
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>Nome do Lead</label>
                  <input placeholder="Ex: João Silva" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0'}} />
                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                        <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>CEP</label>
                        <input placeholder="40000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0', width:'100%'}} />
                    </div>
                    <div style={{flex:1}}>
                        <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>Nascimento</label>
                        <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0', width:'100%'}} />
                    </div>
                  </div>
                  <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>Origem do Lead</label>
                  <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0', background:'white'}}>
                    <option value="Instagram">Instagram</option>
                    <option value="Site">Site</option>
                    <option value="Google">Google</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Outros">Outros</option>
                  </select>
                  <button type="submit" disabled={isSaving} style={{padding:'18px', background:'#ff6b00', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', cursor:'pointer', marginTop:'10px'}}>
                    {isSaving ? 'Salvando...' : idLeadEditando ? 'ATUALIZAR PERFIL' : 'FINALIZAR CADASTRO'}
                  </button>
                  {idLeadEditando && (
                    <button type="button" onClick={()=>{ setView('dashboard'); resetForm(); }} style={{background:'none', border:'none', color:'#999', cursor:'pointer'}}>Cancelar</button>
                  )}
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
