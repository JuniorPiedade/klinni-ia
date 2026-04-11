import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

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
  card: '#ffffff',
  text: '#334155',
  textLight: '#94a3b8',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States Form
  const [idLeadEditando, setIdLeadEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [origemLead, setOrigemLead] = useState('INSTAGRAM');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const dados = {
      nome: nomeLead,
      dataAgendamento, 
      origem: origemLead, 
      valorOrcamento: parseFloat(valorOrcamento) || 0, 
      userId: user.uid, 
      updatedAt: serverTimestamp()
    };

    try {
      if (idLeadEditando) await updateDoc(doc(db, "leads", idLeadEditando), dados);
      else await addDoc(collection(db, "leads"), { ...dados, createdAt: serverTimestamp() });
      resetForm(); setView('dashboard');
    } finally { setIsSaving(false); }
  };

  const resetForm = () => {
    setIdLeadEditando(null); setNomeLead(''); setDataAgendamento(''); 
    setOrigemLead('INSTAGRAM'); setValorOrcamento('');
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.fontFamily }}>
      
      {user && (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'rgba(255,255,255,0.8)', backdropFilter:'blur(10px)', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:100}}>
            <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
            <div style={{display:'flex', gap:'30px'}}>
              <button onClick={()=>{setView('dashboard'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='dashboard'?THEME.primary:THEME.textLight}}>Dashboard</button>
              <button onClick={()=>{setView('novoLead'); resetForm();}} style={{background:'none', border:'none', cursor:'pointer', fontWeight:'600', color:view==='novoLead'?THEME.primary:THEME.textLight}}>+ Novo Lead</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px', maxWidth:'600px', margin:'0 auto'}}>
            {view === 'novoLead' && (
              <div style={{background:'#fff', padding:'45px', borderRadius:'35px', boxShadow:'0 20px 50px rgba(0,0,0,0.03)'}}>
                <h2 style={{textAlign:'center', marginBottom:'35px', fontWeight:'900', letterSpacing:'-1px'}}>
                  {idLeadEditando ? 'Editar Lead' : 'Novo Lead'}
                </h2>
                
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'25px'}}>
                  
                  {/* NOME */}
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight, marginLeft:'5px'}}>NOME</label>
                    <input 
                      placeholder="Nome do cliente" 
                      value={nomeLead} 
                      onChange={e=>setNomeLead(e.target.value)} 
                      required 
                      style={{padding:'18px', borderRadius:'18px', border:'1px solid #f1f5f9', outline:'none', background:'#fcfcfd', fontSize:'15px'}} 
                    />
                  </div>
                  
                  {/* AGENDAMENTO */}
                  <div style={{background:'#fff7ed', padding:'25px', borderRadius:'25px', border:'1px solid #ffe8d6'}}>
                    <label style={{fontSize:'10px', fontWeight:'900', color:THEME.primary, display:'block', marginBottom:'12px', letterSpacing:'0.5px'}}>
                      AGENDAMENTO (DIA / MÊS / HORA)
                    </label>
                    <input 
                      type="datetime-local" 
                      value={dataAgendamento} 
                      onChange={e=>setDataAgendamento(e.target.value)} 
                      required
                      style={{width:'100%', padding:'12px', border:'none', borderRadius:'12px', background:'#fff', fontSize:'15px', fontWeight:'600', color:THEME.secondary, outline:'none'}} 
                    />
                  </div>

                  {/* ORIGEM */}
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight, marginLeft:'5px'}}>ORIGEM DO LEAD</label>
                    <select 
                      value={origemLead} 
                      onChange={e=>setOrigemLead(e.target.value)} 
                      style={{padding:'18px', borderRadius:'18px', border:'1px solid #f1f5f9', background:'#fcfcfd', fontSize:'14px', fontWeight:'600', outline:'none', appearance:'none', cursor:'pointer'}}
                    >
                      <option value="INSTAGRAM">INSTAGRAM</option>
                      <option value="FACEBOOK">FACEBOOK</option>
                      <option value="SITE">SITE</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>

                  {/* VALOR (OPCIONAL NO SEU TEXTO, MAS MANTIDO PARA O DASHBOARD) */}
                  <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight, marginLeft:'5px'}}>ORÇAMENTO ESTIMADO (R$)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0,00" 
                      value={valorOrcamento} 
                      onChange={e=>setValorOrcamento(e.target.value)} 
                      style={{padding:'18px', borderRadius:'18px', border:'1px solid #f1f5f9', background:'#fcfcfd', outline:'none'}} 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSaving} 
                    style={{padding:'22px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'20px', fontWeight:'800', fontSize:'14px', cursor:'pointer', marginTop:'10px', boxShadow:'0 15px 30px rgba(0,0,0,0.1)', transition:'0.3s'}}
                  >
                    {isSaving ? 'PROCESSANDO...' : 'CONFIRMAR CADASTRO'}
                  </button>
                  
                </form>
              </div>
            )}

            {view === 'dashboard' && (
              <div style={{textAlign:'center', marginTop:'100px'}}>
                <p style={{color:THEME.textLight}}>Visualize seus leads na aba Dashboard ou crie um novo para começar.</p>
                <button onClick={()=>setView('novoLead')} style={{marginTop:'20px', background:THEME.primary, color:'#fff', border:'none', padding:'15px 30px', borderRadius:'15px', fontWeight:'700', cursor:'pointer'}}>+ Adicionar Primeiro Lead</button>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
