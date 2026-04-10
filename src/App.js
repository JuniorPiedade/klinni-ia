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
  
  // States Auth (CELULAR)
  const [celular, setCelular] = useState('');
  const [password, setPassword] = useState('');
  const [modoRegistro, setModoRegistro] = useState(false);

  // States Form Lead
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // State do Aviso (Toast)
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

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    const emailFake = `${celular.replace(/\D/g, '')}@klinni.ia`;
    try {
      if (modoRegistro) {
        await createUserWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Bem-vindo de volta!");
      }
    } catch (err) {
      alert("Erro no acesso. Verifique o número e a senha.");
    }
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: serverTimestamp()
      });
      mostrarMensagem(`Lead ${nomeLead} salvo como ${categoria}!`);
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      setTimeout(() => setView('dashboard'), 2000);
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center', color:'#ff6b00', fontWeight:'bold'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#fdfdfd', fontFamily: 'sans-serif' }}>
      
      {/* TOAST DE SUCESSO (VERDE PARA CONTRASTE) */}
      {aviso.visivel && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 9999,
          background: '#22c55e', color: 'white', padding: '12px 30px', 
          borderRadius: '50px', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
        }}>
          {aviso.texto}
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff'}}>
          <div style={{width:'340px', padding:'40px', textAlign:'center'}}>
            <h1 style={{fontSize:'35px', color:'#ff6b00', marginBottom:'5px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300', color:'#333'}}>IA</span></h1>
            <p style={{color:'#666', marginBottom:'30px'}}>Acesse com seu celular</p>
            <form onSubmit={handleAutenticacao} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input placeholder="Celular" value={celular} onChange={e=>setCelular(e.target.value)} required style={{padding:'15px', borderRadius:'10px', border:'2px solid #eee', outline:'none', fontSize:'16px'}} />
              <input type="password" placeholder="Senha" value={password} onChange={e=>setPassword(e.target.value)} required style={{padding:'15px', borderRadius:'10px', border:'2px solid #eee', outline:'none', fontSize:'16px'}} />
              <button style={{padding:'16px', background:'#ff6b00', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', fontSize:'16px', boxShadow:'0 4px 10px rgba(255,107,0,0.3)'}}>
                {modoRegistro ? 'CRIAR CONTA' : 'ENTRAR'}
              </button>
            </form>
            <button onClick={() => setModoRegistro(!modoRegistro)} style={{marginTop:'20px', background:'none', border:'none', color:'#ff6b00', cursor:'pointer', fontWeight:'bold'}}>
              {modoRegistro ? 'Já tenho conta' : 'Quero me cadastrar'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 60px', background:'white', alignItems:'center', borderBottom:'2px solid #ff6b00'}}>
            <h2 style={{margin:0, color:'#ff6b00', fontSize:'24px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300', color:'#333'}}>IA</span></h2>
            <div style={{display:'flex', gap:'30px'}}>
              <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='dashboard'?'#ff6b00':'#333', borderBottom: view==='dashboard'?'2px solid #ff6b00':'none'}}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: 'bold', color: view==='novoLead'?'#ff6b00':'#333', borderBottom: view==='novoLead'?'2px solid #ff6b00':'none'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'#999', border:'none', background:'none', cursor:'pointer', fontWeight:'bold'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 60px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'30px'}}>
                {leads.map(l => (
                  <div key={l.id} style={{background:'white', padding:'30px', borderRadius:'20px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)', borderLeft: l.categoria === 'HIGH TICKET' ? '8px solid #ffb300' : '8px solid #ff6b00'}}>
                    <span style={{fontSize:'11px', fontWeight:'900', color:'#ff6b00', letterSpacing:'1px'}}>{l.categoria}</span>
                    <h4 style={{margin:'15px 0 5px 0', fontSize:'22px', color:'#333'}}>{l.nome}</h4>
                    <p style={{fontSize:'14px', color:'#777', margin:0}}>📍 Salvador | CEP: {l.cep}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{maxWidth:'450px', margin:'0 auto', background:'white', padding:'50px', borderRadius:'30px', boxShadow:'0 15px 35px rgba(0,0,0,0.1)'}}>
                <h2 style={{marginBottom:'30px', color:'#333', textAlign:'center'}}>Novo Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <input placeholder="Nome do Cliente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #eee'}} />
                  <input placeholder="CEP Salvador" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #eee'}} />
                  <input placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required style={{padding:'15px', borderRadius:'12px', border:'2px solid #eee'}} />
                  <button type="submit" disabled={isSaving} style={{padding:'18px', background:'#ff6b00', color:'white', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'18px', cursor:'pointer', boxShadow:'0 5px 15px rgba(255,107,0,0.3)'}}>
                    {isSaving ? 'Processando...' : 'CLASSIFICAR AGORA'}
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
