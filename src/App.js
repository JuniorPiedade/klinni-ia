import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

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
  
  // States Autenticação
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);

  // States Formulário (Novos Campos)
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

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    // Cálculo de idade simples para triagem
    const anoNasc = new Date(nascimentoLead).getFullYear();
    const anoAtual = new Date().getFullYear();
    const idade = anoAtual - anoNasc;

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && idade >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, 
        cep: cepLead, 
        dataNascimento: nascimentoLead,
        origem: origemLead,
        categoria,
        status: "NOVO LEAD", 
        userId: user.uid, 
        createdAt: serverTimestamp()
      });

      mostrarMensagem(`Sucesso! Lead vindo do ${origemLead} salvo.`);
      setNomeLead(''); setCepLead(''); setNascimentoLead('');
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
              <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='dashboard'?'#ff6b00':'#333'}}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='novoLead'?'#ff6b00':'#333'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'#999', border:'none', background:'none', cursor:'pointer'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'25px'}}>
                {leads.map(l => (
                  <div key={l.id} style={{background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 4px 12px rgba(0,0,0,0.05)', borderLeft: l.categoria === 'HIGH TICKET' ? '8px solid #ffb300' : '8px solid #ff6b00'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <span style={{fontSize:'10px', fontWeight:'900', color:'#ff6b00', textTransform:'uppercase'}}>{l.categoria}</span>
                        <span style={{fontSize:'10px', background:'#f0f0f0', padding:'4px 8px', borderRadius:'10px', color:'#666'}}>{l.origem}</span>
                    </div>
                    <h4 style={{margin:'15px 0 5px 0', fontSize:'22px', color:'#333'}}>{l.nome}</h4>
                    <p style={{fontSize:'14px', color:'#777', margin:0}}>📍 CEP: {l.cep} | 🎂 {new Date(l.dataNascimento).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{maxWidth:'480px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'30px', boxShadow:'0 15px 35px rgba(0,0,0,0.08)'}}>
                <h2 style={{marginBottom:'30px', color:'#333', textAlign:'center', fontWeight:'900'}}>Novo Cadastro</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>Nome do Lead</label>
                  <input placeholder="Ex: João Silva" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0'}} />
                  
                  <div style={{display:'flex', gap:'15px'}}>
                    <div style={{flex:1}}>
                        <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>CEP</label>
                        <input placeholder="40000-000" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0', width:'100%', boxSizing:'border-box'}} />
                    </div>
                    <div style={{flex:1}}>
                        <label style={{fontSize:'14px', fontWeight:'bold', color:'#555'}}>Nascimento</label>
                        <input type="date" value={nascimentoLead} onChange={e=>setNascimentoLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #f0f0f0', width:'100%', boxSizing:'border-box'}} />
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
                    {isSaving ? 'Salvando...' : 'FINALIZAR CADASTRO'}
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
