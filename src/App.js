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
    setTimeout(() => setAviso({ visivel: false, texto: '' }), 3500);
  };

  const handleAutenticacao = async (e) => {
    e.preventDefault();
    // Transforma o número em um "e-mail" interno para o Firebase aceitar
    const emailFake = `${celular.replace(/\D/g, '')}@klinni.ia`;
    
    try {
      if (modoRegistro) {
        await createUserWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Conta criada com sucesso!");
      } else {
        await signInWithEmailAndPassword(auth, emailFake, password);
        mostrarMensagem("Acesso autorizado!");
      }
    } catch (err) {
      console.error(err.code);
      if (err.code === 'auth/unauthorized-domain') {
        alert("Erro: Este domínio não está autorizado no Firebase. Adicione o link do Vercel nas configurações.");
      } else {
        alert("Erro: Verifique o número e a senha (mínimo 6 dígitos).");
      }
    }
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: serverTimestamp()
      });

      mostrarMensagem(`Sucesso! ${nomeLead} foi classificado.`);
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      
      setTimeout(() => {
        setView('dashboard');
        setIsSaving(false);
      }, 2500);
    } catch (err) {
      alert("Erro ao salvar no banco de dados.");
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{padding:'50px', textAlign:'center', fontWeight:'bold'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* AVISO VERDE (TOAST) - Sempre visível no topo da árvore DOM */}
      {aviso.visivel && (
        <div style={{
          position: 'fixed', top: '25px', right: '25px', zIndex: 99999,
          background: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)',
          padding: '16px 24px', borderRadius: '16px', display: 'flex', alignItems: 'center',
          gap: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0'
        }}>
          <div style={{width:'22px', height:'22px', background:'#22c55e', borderRadius:'50%', color:'white', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold', fontSize:'12px'}}>✓</div>
          <span style={{color: '#1e293b', fontWeight: '700'}}>{aviso.texto}</span>
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0070f3'}}>
          <div style={{background:'white', padding:'40px', borderRadius:'25px', width:'320px', textAlign:'center'}}>
            <h1 style={{color:'#0070f3', marginBottom:'5px', fontWeight:'900'}}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h1>
            <p style={{color:'#64748b', fontSize:'14px', marginBottom:'25px'}}>Acesse com seu número</p>
            <form onSubmit={handleAutenticacao} style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              <input 
                placeholder="Número de Celular" 
                value={celular} 
                onChange={e=>setCelular(e.target.value)} 
                required 
                style={{padding:'14px', borderRadius:'10px', border:'1px solid #ddd', fontSize:'16px'}} 
              />
              <input 
                type="password" 
                placeholder="Senha (6+ dígitos)" 
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                required 
                style={{padding:'14px', borderRadius:'10px', border:'1px solid #ddd', fontSize:'16px'}} 
              />
              <button style={{background:'#0070f3', color:'white', padding:'15px', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', fontSize:'16px'}}>
                {modoRegistro ? 'Criar Conta' : 'Entrar no Sistema'}
              </button>
            </form>
            <p onClick={() => setModoRegistro(!modoRegistro)} style={{marginTop:'20px', fontSize:'13px', color:'#64748b', cursor:'pointer'}}>
              {modoRegistro ? 'Já sou cadastrado' : 'Ainda não tenho acesso'}
            </p>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'20px 50px', background:'white', alignItems:'center', borderBottom:'1px solid #eee'}}>
            <h2 style={{color:'#0070f3', margin:0}}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h2>
            <div style={{display:'flex', gap:'20px'}}>
              <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer', color: view === 'dashboard' ? '#0070f3' : '#64748b', fontWeight: 'bold'}}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', cursor:'pointer', color: view === 'novoLead' ? '#0070f3' : '#64748b', fontWeight: 'bold'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'#ef4444', border:'none', background:'none', cursor:'pointer'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                {leads.map(l => (
                  <div key={l.id} style={{background:'white', padding:'25px', borderRadius:'20px', border: l.categoria === 'HIGH TICKET' ? '2px solid #fbbf24' : '1px solid #eee'}}>
                    <span style={{fontSize:'10px', fontWeight:'800', color: l.categoria === 'HIGH TICKET' ? '#d97706' : '#0070f3', background: l.categoria === 'HIGH TICKET' ? '#fef3c7' : '#eff6ff', padding:'4px 8px', borderRadius:'6px'}}>{l.categoria}</span>
                    <h3 style={{margin:'15px 0 5px 0', color:'#1e293b'}}>{l.nome}</h3>
                    <p style={{fontSize:'13px', color:'#94a3b8', margin:0}}>📍 Salvador - CEP: {l.cep} | {l.idade} anos</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{maxWidth:'400px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'25px', boxShadow:'0 10px 25px rgba(0,0,0,0.05)'}}>
                <h2 style={{marginBottom:'25px', textAlign:'center'}}>Cadastrar Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <input placeholder="Nome do Lead" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'14px', borderRadius:'10px', border:'1px solid #eee'}} />
                  <input placeholder="CEP (Salvador)" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'14px', borderRadius:'10px', border:'1px solid #eee'}} />
                  <input placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required style={{padding:'14px', borderRadius:'10px', border:'1px solid #eee'}} />
                  <button type="submit" disabled={isSaving} style={{background:'#0070f3', color:'white', padding:'16px', border:'none', borderRadius:'12px', fontWeight:'bold', fontSize:'16px', cursor:'pointer'}}>
                    {isSaving ? 'Analisando...' : 'Classificar com IA'}
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
