import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

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

const THEME = {
  primary: '#ff6b00',
  secondary: '#1e293b',
  bg: '#fcfcfd',
  fontFamily: 'sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Lead States
  const [nomeLead, setNomeLead] = useState('');
  const [dataManual, setDataManual] = useState('');
  const [origemLead, setOrigemLead] = useState('INSTAGRAM');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsubLeads = onSnapshot(q, (s) => {
        setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubLeads();
    } catch (e) { console.error("Erro Firestore:", e); }
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert("Falha no login: " + err.message); }
  };

  const handleDataChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    let formatted = "";
    if (v.length > 0) formatted += v.substring(0, 2);
    if (v.length > 2) formatted += "/" + v.substring(2, 4);
    if (v.length > 4) formatted += " às " + v.substring(4, 6);
    if (v.length > 6) formatted += ":" + v.substring(6, 8);
    setDataManual(formatted);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    if (!dataManual.includes(" às ")) return alert("Formato de data inválido!");
    setIsSaving(true);
    try {
      const [dataParte, horaParte] = dataManual.split(" às ");
      const [dia, mes] = dataParte.split("/");
      const [hora, min] = horaParte.split(":");
      const dataISO = `${new Date().getFullYear()}-${mes}-${dia}T${hora}:${min}:00`;

      await addDoc(collection(db, "leads"), {
        nome: nomeLead,
        dataAgendamento: dataISO,
        origem: origemLead,
        valorOrcamento: parseFloat(valorOrcamento) || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      
      setNomeLead(''); setDataManual(''); setValorOrcamento('');
      setView('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    finally { setIsSaving(false); }
  };

  if (loading) return <div style={{padding: 50, textAlign: 'center'}}>Carregando Klinni...</div>;

  // Se não houver usuário, renderiza tela de login em vez de tela branca
  if (!user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: THEME.bg, fontFamily: THEME.fontFamily }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', width: '320px' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>KLINNI IA</h2>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '8px', border: '1px solid #ddd' }} />
          <button type="submit" style={{ width: '100%', padding: '12px', background: THEME.secondary, color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.fontFamily }}>
      <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', borderBottom:'1px solid #f1f5f9'}}>
        <h2 style={{fontWeight:'900'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
        <div style={{display:'flex', gap:'20px'}}>
          <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: view === 'dashboard' ? 'bold' : 'normal'}}>DASHBOARD</button>
          <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: view === 'novoLead' ? 'bold' : 'normal'}}>+ NOVO LEAD</button>
          <button onClick={()=>signOut(auth)} style={{background:'none', border:'none', cursor:'pointer', color: 'red'}}>SAIR</button>
        </div>
      </nav>

      <main style={{padding:'40px 50px', maxWidth:'1200px', margin:'0 auto'}}>
        {view === 'dashboard' ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
            {leads.map(l => (
              <div key={l.id} style={{background:'#fff', padding:'25px', borderRadius:'20px', border:'1px solid #f1f5f9'}}>
                <div style={{fontSize:'10px', color:THEME.primary, fontWeight:'bold'}}>{l.origem}</div>
                <h4 style={{margin:'10px 0'}}>{l.nome}</h4>
                <div style={{fontSize:'12px', color: '#3b82f6'}}>
                  {l.dataAgendamento ? new Date(l.dataAgendamento).toLocaleString('pt-BR') : 'Sem data'}
                </div>
                <div style={{marginTop:'15px', fontWeight:'bold'}}>R$ {l.valorOrcamento?.toLocaleString('pt-BR')}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{maxWidth:'500px', margin:'0 auto', background:'#fff', padding:'30px', borderRadius:'20px'}}>
            <h3>Novo Registro</h3>
            <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #eee'}} />
              <input placeholder="Data: DDMMHHMM" value={dataManual} onChange={handleDataChange} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #eee'}} />
              <input type="number" placeholder="Valor" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'12px', borderRadius:'8px', border:'1px solid #eee'}} />
              <button type="submit" disabled={isSaving} style={{padding:'15px', background:THEME.secondary, color:'#fff', borderRadius:'8px', border:'none', cursor:'pointer'}}>
                {isSaving ? 'SALVANDO...' : 'CADASTRAR'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
