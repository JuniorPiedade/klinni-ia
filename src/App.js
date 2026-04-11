import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, updateDoc, doc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

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
  const [nomeLead, setNomeLead] = useState('');
  const [dataManual, setDataManual] = useState(''); 
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

  // Máscara DD/MM às HH:MM
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

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.fontFamily }}>
      {user && (
        <>
          <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:10}}>
            <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
            <div style={{display:'flex', gap:'20px'}}>
              <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', fontWeight:'700', color:view==='dashboard'?THEME.primary:THEME.textLight, cursor:'pointer'}}>DASHBOARD</button>
              <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', fontWeight:'700', color:view==='novoLead'?THEME.primary:THEME.textLight, cursor:'pointer'}}>+ NOVO LEAD</button>
            </div>
          </nav>

          <main style={{padding:'40px 50px', maxWidth:'1200px', margin:'0 auto'}}>
            {view === 'dashboard' ? (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                {leads.length > 0 ? leads.map(l => (
                  <div key={l.id} style={{background:'#fff', padding:'25px', borderRadius:'24px', border:'1px solid #f1f5f9', boxShadow:'0 10px 30px rgba(0,0,0,0.01)'}}>
                    <div style={{fontSize:'9px', fontWeight:'900', color:THEME.primary, marginBottom:'5px'}}>{l.origem}</div>
                    <h4 style={{margin:'0 0 10px 0', fontSize:'17px', fontWeight:'700'}}>{l.nome}</h4>
                    <div style={{fontSize:'12px', color:'#3b82f6', fontWeight:'700', marginBottom:'15px'}}>
                      🗓️ {new Date(l.dataAgendamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} às {new Date(l.dataAgendamento).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                    </div>
                    <div style={{borderTop:'1px solid #fcfcfd', paddingTop:'10px', display:'flex', justifyContent:'space-between'}}>
                      <span style={{fontSize:'10px', color:THEME.textLight, fontWeight:'600'}}>VALOR</span>
                      <span style={{fontSize:'15px', fontWeight:'800'}}>R$ {l.valorOrcamento.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                    </div>
                  </div>
                )) : (
                  <div style={{gridColumn:'1/-1', textAlign:'center', color:THEME.textLight, marginTop:'50px'}}>Nenhum lead encontrado.</div>
                )}
              </div>
            ) : (
              <div style={{maxWidth:'500px', margin:'0 auto', background:'#fff', padding:'40px', borderRadius:'30px', boxShadow:'0 20px 50px rgba(0,0,0,0.03)'}}>
                <h2 style={{textAlign:'center', marginBottom:'30px', fontWeight:'900'}}>Novo Lead</h2>
                <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight}}>NOME</label>
                    <input placeholder="Nome do cliente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd', outline:'none'}} />
                  </div>
                  <div style={{background:'#fff7ed', padding:'20px', borderRadius:'20px', border:'1px solid #ffe8d6'}}>
                    <label style={{fontSize:'10px', fontWeight:'900', color:THEME.primary, display:'block', marginBottom:'8px'}}>AGENDAMENTO (DIA / MÊS / HORA)</label>
                    <input placeholder="Ex: 12/04 às 14:30" value={dataManual} onChange={handleDataChange} required style={{width:'100%', padding:'10px', border:'none', background:'#fff', fontSize:'16px', fontWeight:'700', outline:'none'}} />
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight}}>ORIGEM DO LEAD</label>
                    <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd', outline:'none', cursor:'pointer'}}>
                      <option value="INSTAGRAM">INSTAGRAM</option>
                      <option value="FACEBOOK">FACEBOOK</option>
                      <option value="SITE">SITE</option>
                      <option value="OUTROS">OUTROS</option>
                    </select>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                    <label style={{fontSize:'11px', fontWeight:'800', color:THEME.textLight}}>VALOR ESTIMADO (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd', outline:'none'}} />
                  </div>
                  <button type="submit" disabled={isSaving} style={{padding:'20px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'16px', fontWeight:'800', cursor:'pointer'}}>{isSaving ? 'SALVANDO...' : 'CADASTRAR LEAD'}</button>
                </form>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}
