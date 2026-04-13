import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  RecaptchaVerifier, 
  signInWithPhoneNumber 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";

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
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States Form Lead
  const [nomeLead, setNomeLead] = useState('');
  const [dataManual, setDataManual] = useState('');
  const [origemLead, setOrigemLead] = useState('INSTAGRAM');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // States Auth
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // CONFIGURAR RECAPTCHA
  useEffect(() => {
    if (!user && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleSendCode = async () => {
    if (!phone.startsWith('+')) {
      setAuthError("Use o formato: +5571999999999");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, appVerifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      console.error(error);
      setAuthError("Erro ao enviar código. Verifique o número.");
    }
    setAuthLoading(false);
  };

  const handleConfirmCode = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      console.error(error);
      setAuthError("Código inválido.");
    }
    setAuthLoading(false);
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

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "20px", border: "1px solid #e4e4e7", width: "100%", maxWidth: "360px" }}>
          <h2 style={{ marginBottom: "20px", fontWeight: "900" }}>KLINNI IA</h2>
          {step === "phone" ? (
            <>
              <p style={{ fontSize: "14px", color: THEME.textLight, marginBottom: "15px" }}>Digite seu número para entrar</p>
              <input
                placeholder="+55 71 99999-9999"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "14px", marginBottom: "12px", borderRadius: "10px", border: "1px solid #e4e4e7", outline: "none" }}
              />
              <button 
                onClick={handleSendCode} 
                disabled={authLoading} 
                style={{ width: "100%", padding: "14px", background: THEME.secondary, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                {authLoading ? "Enviando..." : "Enviar código"}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: "14px", color: THEME.textLight, marginBottom: "15px" }}>Insira o código enviado</p>
              <input
                placeholder="Código SMS"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={{ width: "100%", padding: "14px", marginBottom: "12px", borderRadius: "10px", border: "1px solid #e4e4e7", outline: "none" }}
              />
              <button 
                onClick={handleConfirmCode} 
                disabled={authLoading} 
                style={{ width: "100%", padding: "14px", background: THEME.primary, color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" }}
              >
                {authLoading ? "Verificando..." : "Confirmar código"}
              </button>
              <button 
                onClick={() => setStep("phone")} 
                style={{ width: "100%", background: "none", border: "none", marginTop: "10px", fontSize: "12px", color: THEME.textLight, cursor: "pointer" }}
              >
                Voltar e alterar número
              </button>
            </>
          )}
          {authError && <p style={{ color: "red", fontSize: "12px", marginTop: "10px" }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font }}>
      <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 50px', background:'#fff', borderBottom:'1px solid #f1f5f9', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
        <div style={{display:'flex', gap:'20px', alignItems: 'center'}}>
          <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', fontWeight:'700', color:view==='dashboard'?THEME.primary:THEME.textLight, cursor:'pointer'}}>DASHBOARD</button>
          <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', fontWeight:'700', color:view==='novoLead'?THEME.primary:THEME.textLight, cursor:'pointer'}}>+ NOVO LEAD</button>
          <button onClick={()=>signOut(auth)} style={{background:'none', border:'none', fontSize: '12px', color: THEME.textLight, cursor: 'pointer'}}>SAIR</button>
        </div>
      </nav>

      <main style={{padding:'40px 50px', maxWidth:'1200px', margin:'0 auto'}}>
        {view === 'dashboard' ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
            {leads.length > 0 ? leads.map(l => (
              <div key={l.id} style={{background:'#fff', padding:'25px', borderRadius:'24px', border:'1px solid #f1f5f9'}}>
                <div style={{fontSize:'9px', fontWeight:'900', color:THEME.primary, marginBottom:'5px'}}>{l.origem}</div>
                <h4 style={{margin:'0 0 10px 0', fontSize:'17px', fontWeight:'700'}}>{l.nome}</h4>
                <div style={{fontSize:'12px', color:'#3b82f6', fontWeight:'700', marginBottom:'15px'}}>
                  {l.dataAgendamento && new Date(l.dataAgendamento).toLocaleString('pt-BR')}
                </div>
                <div style={{borderTop:'1px solid #fcfcfd', paddingTop:'10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <span style={{fontSize:'10px', color:THEME.textLight, fontWeight:'600'}}>VALOR</span>
                  <span style={{fontSize:'16px', fontWeight:'800'}}>R$ {(l.valorOrcamento || 0).toLocaleString('pt-BR')}</span>
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
              <input placeholder="Nome do cliente" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd'}} />
              <input placeholder="Ex: 12/04 às 14:30" value={dataManual} onChange={handleDataChange} required style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd'}} />
              <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd'}}>
                <option value="INSTAGRAM">INSTAGRAM</option>
                <option value="FACEBOOK">FACEBOOK</option>
                <option value="SITE">SITE</option>
                <option value="OUTROS">OUTROS</option>
              </select>
              <input type="number" step="0.01" placeholder="Valor (R$)" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{padding:'16px', borderRadius:'14px', border:'1px solid #f1f5f9', background:'#fcfcfd'}} />
              <button type="submit" disabled={isSaving} style={{padding:'20px', background:THEME.secondary, color:'#fff', border:'none', borderRadius:'16px', fontWeight:'800', cursor:'pointer'}}>{isSaving ? 'SALVANDO...' : 'CADASTRAR LEAD'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
