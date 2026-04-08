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
  appId: "1:761229946691:web:feeceb3caed42445be09f6",
  measurementId: "G-D22KSD4C7C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States de entrada
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ESTADO DO AVISO (Gatilho mestre)
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { alert("Erro de acesso."); }
  };

  const handleNovoLead = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    const nobres = ['40140', '41940', '40080', '41810', '41820', '41760'];
    const categoria = (nobres.includes(cepLead.substring(0, 5)) && parseInt(idadeLead) >= 20) ? "HIGH TICKET" : "Ticket Médio";
    
    try {
      // 1. SALVA NO FIREBASE
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, cep: cepLead, idade: idadeLead, categoria,
        status: "NOVO LEAD", userId: user.uid, createdAt: serverTimestamp()
      });

      // 2. DISPARA O AVISO IMEDIATAMENTE
      setToastMsg(`Sucesso! ${nomeLead} foi classificado.`);
      setShowToast(true);

      // 3. LIMPA OS INPUTS MAS MANTÉM NA TELA POR 2 SEGUNDOS
      setNomeLead(''); setCepLead(''); setIdadeLead('');
      
      setTimeout(() => {
        setShowToast(false);
        setView('dashboard');
      }, 2500);

    } catch (err) {
      alert("Erro ao salvar lead.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{display:'flex', height:'100vh', alignItems:'center', justifyContent:'center'}}>KLINNI IA...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
      
      {/* AVISO GERAL (FORA DE QUALQUER DIV DE CONTEÚDO) */}
      {showToast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
          padding: '15px 25px', borderRadius: '15px', display: 'flex', alignItems: 'center',
          gap: '12px', border: '1px solid rgba(255,255,255,0.4)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{width:'24px', height:'24px', background:'#22c55e', borderRadius:'50%', color:'#fff', display:'flex', justifyContent:'center', alignItems:'center', fontWeight:'bold'}}>✓</div>
          <span style={{color: '#1e293b', fontWeight: '700'}}>{toastMsg}</span>
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0070f3'}}>
          <div style={{background:'#fff', padding:'40px', borderRadius:'25px', textAlign:'center', width:'300px'}}>
            <h1 style={{color:'#0070f3', marginBottom:'20px'}}>KLINNI <span>IA</span></h1>
            <form onSubmit={handleAuth} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
              <input type="email" placeholder="E-mail" style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}} onChange={e=>setEmail(e.target.value)} required />
              <input type="password" placeholder="Senha" style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}} onChange={e=>setPassword(e.target.value)} required />
              <button style={{padding:'12px', borderRadius:'10px', background:'#0070f3', color:'#fff', border:'none', fontWeight:'bold'}}>Entrar</button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', alignItems:'center'}}>
            <h2 style={{color:'#0070f3', fontWeight:'800'}}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h2>
            <div style={{display:'flex', gap:'20px'}}>
              <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: view==='dashboard'?'800':'400'}}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', cursor:'pointer', fontWeight: view==='novoLead'?'800':'400'}}>+ Novo Lead</button>
              <button onClick={()=>signOut(auth)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Sair</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px'}}>
            {view === 'dashboard' ? (
              <div>
                <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
                  <div style={{background:'#fff', padding:'20px', borderRadius:'15px', flex:1}}>Total: {leads.length}</div>
                  <div style={{background:'#fff', padding:'20px', borderRadius:'15px', flex:1, border:'1px solid gold'}}>High Ticket: {leads.filter(l=>l.categoria==='HIGH TICKET').length}</div>
                </div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                  {leads.map(l => (
                    <div key={l.id} style={{background:'#fff', padding:'20px', borderRadius:'15px', border: l.categoria==='HIGH TICKET'?'2px solid gold':'1px solid #eee'}}>
                      <span style={{fontSize:'10px', fontWeight:'bold', color:'#0070f3'}}>{l.categoria}</span>
                      <h3 style={{margin:'10px 0'}}>{l.nome}</h3>
                      <p style={{fontSize:'12px', color:'#666'}}>📍 {l.cep} | 🎂 {l.idade} anos</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{display:'flex', justifyContent:'center'}}>
                <div style={{background:'#fff', padding:'40px', borderRadius:'25px', width:'400px'}}>
                  <h2 style={{marginBottom:'20px'}}>Novo Lead</h2>
                  <form onSubmit={handleNovoLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                    <input placeholder="Nome" style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}} value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required />
                    <input placeholder="CEP" style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}} value={cepLead} onChange={e=>setCepLead(e.target.value)} required />
                    <input placeholder="Idade" type="number" style={{padding:'12px', borderRadius:'10px', border:'1px solid #ddd'}} value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required />
                    <button type="submit" disabled={isSaving} style={{padding:'12px', borderRadius:'10px', background:'#0070f3', color:'#fff', border:'none', fontWeight:'bold'}}>
                      {isSaving ? 'Salvando...' : 'Classificar Lead'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
