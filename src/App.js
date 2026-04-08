import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

// --- CONFIGURAÇÃO OFICIAL ---
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
  
  const [nomeLead, setNomeLead] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // AVISO (TOAST)
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

  const handleNovoLead = async (e) => {
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

      // GATILHO DO AVISO
      setAviso({ visivel: true, texto: `Lead ${nomeLead} salvo como ${categoria}!` });

      // LIMPAR DADOS
      setNomeLead(''); setCepLead(''); setIdadeLead('');

      // TRAVAR NA TELA POR 3 SEGUNDOS ANTES DE VOLTAR
      setTimeout(() => {
        setAviso({ visivel: false, texto: '' });
        setView('dashboard');
        setIsSaving(false);
      }, 3000);

    } catch (err) {
      alert("Erro ao salvar.");
      setIsSaving(false);
    }
  };

  if (loading) return <div style={{padding:'20px'}}>Carregando...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'sans-serif', position: 'relative' }}>
      
      {/* AVISO GLASSMORPHISM - POSIÇÃO FORÇADA POR CSS INLINE BRUTO */}
      {aviso.visivel && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 999999, // Z-INDEX EXTREMO
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)', // Suporte para Safari/iOS
          padding: '16px 24px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.5)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{width:'24px', height:'24px', background:'#22c55e', borderRadius:'50%', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>✓</div>
          <span style={{color:'#1e293b', fontWeight:'700', fontSize:'15px'}}>{aviso.texto}</span>
        </div>
      )}

      {!user ? (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0070f3'}}>
           <button onClick={() => signInWithEmailAndPassword(auth, "teste@teste.com", "123456")} style={{padding:'20px', borderRadius:'10px'}}>Login Temporário (Use seus dados)</button>
           {/* Removi o form de login aqui para focar no erro do lead */}
        </div>
      ) : (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', alignItems:'center', borderBottom:'1px solid #eee'}}>
            <h2 style={{color:'#0070f3', fontWeight:'800'}}>KLINNI <span style={{fontWeight:'300'}}>IA</span></h2>
            <div style={{display:'flex', gap:'20px'}}>
              <button onClick={()=>setView('dashboard')} style={{background:view==='dashboard'?'#f1f5f9':'none', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>Dashboard</button>
              <button onClick={()=>setView('novoLead')} style={{background:view==='novoLead'?'#f1f5f9':'none', border:'none', padding:'10px', borderRadius:'8px', cursor:'pointer'}}>+ Novo Lead</button>
            </div>
          </nav>

          <main style={{padding:'40px'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>
                {leads.map(l => (
                  <div key={l.id} style={{padding:'20px', background:'white', borderRadius:'15px', border: l.categoria==='HIGH TICKET'?'2px solid #fbbf24':'1px solid #eee'}}>
                    <b style={{color:'#0070f3'}}>{l.categoria}</b>
                    <h3 style={{margin:'10px 0'}}>{l.nome}</h3>
                    <p>CEP: {l.cep}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{maxWidth:'400px', margin:'0 auto', background:'white', padding:'40px', borderRadius:'20px', boxShadow:'0 10px 20px rgba(0,0,0,0.05)'}}>
                <h2 style={{marginBottom:'20px'}}>Novo Lead</h2>
                <form onSubmit={handleNovoLead} style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                  <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} />
                  <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} />
                  <input placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} required style={{padding:'12px', borderRadius:'8px', border:'1px solid #ddd'}} />
                  <button type="submit" disabled={isSaving} style={{padding:'15px', background:'#0070f3', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer'}}>
                    {isSaving ? 'Salvando...' : 'Classificar Lead'}
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
