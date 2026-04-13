import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
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
  text: '#334155',
  textLight: '#94a3b8',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Auth Method State
  const [authMethod, setAuthMethod] = useState('email'); // 'email' ou 'phone'
  
  // Email Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Phone Auth States
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  
  // UI States
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Lead States
  const [nomeLead, setNomeLead] = useState('');
  const [dataManual, setDataManual] = useState('');
  const [origemLead, setOrigemLead] = useState('INSTAGRAM');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // Recaptcha Loader
  useEffect(() => {
    if (!user && authMethod === 'phone' && step === 'phone') {
      const initRecaptcha = () => {
        if (!window.recaptchaVerifier) {
          const container = document.getElementById("recaptcha-container");
          if (container) {
            try {
              window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
            } catch (e) { console.error(e); }
          }
        }
      };
      const timer = setTimeout(initRecaptcha, 500);
      return () => clearTimeout(timer);
    }
  }, [user, authMethod, step]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // --- HANDLERS AUTH ---
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true); setAuthError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) { setAuthError("Email ou senha inválidos."); }
    setAuthLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return setAuthError("Digite seu email primeiro.");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true); setAuthError("");
    } catch (err) { setAuthError("Erro ao enviar email de recuperação."); }
  };

  const handleSendCode = async () => {
    if (!phone.startsWith('+')) return setAuthError("Use o formato: +5571999999999");
    setAuthLoading(true); setAuthError("");
    try {
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) { setAuthError("Erro ao enviar SMS."); }
    setAuthLoading(false);
  };

  const handleConfirmCode = async () => {
    setAuthLoading(true);
    try { await confirmationResult.confirm(code); } 
    catch (error) { setAuthError("Código inválido."); }
    setAuthLoading(false);
  };

  // --- HANDLERS LEADS ---
  const handleDataChange = (e) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.substring(0, 8);
    let f = "";
    if (v.length > 0) f += v.substring(0, 2);
    if (v.length > 2) f += "/" + v.substring(2, 4);
    if (v.length > 4) f += " às " + v.substring(4, 6);
    if (v.length > 6) f += ":" + v.substring(6, 8);
    setDataManual(f);
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const [d, h] = dataManual.split(" às ");
      const [dia, mes] = d.split("/");
      const [hora, min] = h.split(":");
      const dataISO = `${new Date().getFullYear()}-${mes}-${dia}T${hora}:${min}:00`;
      await addDoc(collection(db, "leads"), {
        nome: nomeLead, dataAgendamento: dataISO, origem: origemLead,
        valorOrcamento: parseFloat(valorOrcamento) || 0, userId: user.uid, createdAt: serverTimestamp()
      });
      setNomeLead(''); setDataManual(''); setValorOrcamento(''); setView('dashboard');
    } catch (err) { alert("Erro ao salvar."); }
    finally { setIsSaving(false); }
  };

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa", fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: "1px solid #e4e4e7", width: "100%", maxWidth: "360px" }}>
          <h2 style={{ marginBottom: "20px", fontWeight: "900", textAlign: 'center' }}>KLINNI IA</h2>
          
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <button onClick={() => setAuthMethod('email')} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: authMethod === 'email' ? THEME.secondary : '#f4f4f5', color: authMethod === 'email' ? '#fff' : '#71717a' }}>E-mail</button>
            <button onClick={() => setAuthMethod('phone')} style={{ flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', border: 'none', background: authMethod === 'phone' ? THEME.secondary : '#f4f4f5', color: authMethod === 'phone' ? '#fff' : '#71717a' }}>WhatsApp</button>
          </div>

          {authMethod === 'email' ? (
            <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
              <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} />
              <button type="submit" disabled={authLoading} style={buttonStyle}>{authLoading ? "Entrando..." : "Entrar"}</button>
              <button type="button" onClick={handleResetPassword} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.textLight, cursor: 'pointer' }}>
                {resetSent ? "✓ Link enviado ao email" : "Esqueci minha senha"}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {step === "phone" ? (
                <>
                  <input placeholder="+5571999999999" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
                  <button onClick={handleSendCode} disabled={authLoading} style={buttonStyle}>{authLoading ? "Enviando..." : "Enviar SMS"}</button>
                </>
              ) : (
                <>
                  <input placeholder="Código de 6 dígitos" value={code} onChange={e => setCode(e.target.value)} style={inputStyle} />
                  <button onClick={handleConfirmCode} disabled={authLoading} style={{...buttonStyle, background: THEME.primary}}>Confirmar Código</button>
                  <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', fontSize: '12px', color: THEME.textLight, cursor: 'pointer' }}>Voltar</button>
                </>
              )}
              <div id="recaptcha-container"></div>
            </div>
          )}
          {authError && <p style={{ color: "red", fontSize: "12px", marginTop: "12px", textAlign: 'center' }}>{authError}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font }}>
      <nav style={{display:'flex', justifyContent:'space-between', padding:'15px 40px', background:'#fff', borderBottom:'1px solid #e4e4e7', position:'sticky', top:0, zIndex:10}}>
        <h2 style={{fontWeight:'900', fontSize:'18px'}}>KLINNI <span style={{color:THEME.primary}}>IA</span></h2>
        <div style={{display:'flex', gap:'20px', alignItems: 'center'}}>
          <button onClick={()=>setView('dashboard')} style={{background:'none', border:'none', fontWeight:'700', color:view==='dashboard'?THEME.primary:THEME.textLight, cursor:'pointer'}}>DASHBOARD</button>
          <button onClick={()=>setView('novoLead')} style={{background:'none', border:'none', fontWeight:'700', color:view==='novoLead'?THEME.primary:THEME.textLight, cursor:'pointer'}}>+ NOVO LEAD</button>
          <button onClick={()=>signOut(auth)} style={{background:'none', border:'none', color: THEME.textLight, cursor: 'pointer', fontWeight: 'bold'}}>Sair</button>
        </div>
      </nav>

      <main style={{padding:'40px', maxWidth:'1200px', margin:'0 auto'}}>
        {view === 'dashboard' ? (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
            {leads.map(l => (
              <div key={l.id} style={{background:'#fff', padding:'25px', borderRadius:'24px', border:'1px solid #e4e4e7'}}>
                <div style={{fontSize:'9px', fontWeight:'900', color:THEME.primary, marginBottom:'5px'}}>{l.origem}</div>
                <h4 style={{margin:'0 0 10px 0', fontSize:'17px', fontWeight:'700'}}>{l.nome}</h4>
                <div style={{fontSize:'12px', color:'#3b82f6', fontWeight:'700', marginBottom:'15px'}}>{l.dataAgendamento && new Date(l.dataAgendamento).toLocaleString('pt-BR')}</div>
                <div style={{borderTop:'1px solid #fcfcfd', paddingTop:'10px', display:'flex', justifyContent:'space-between', alignItems: 'center'}}>
                  <span style={{fontSize:'10px', color:THEME.textLight, fontWeight:'600'}}>VALOR</span>
                  <span style={{fontSize:'16px', fontWeight:'800'}}>R$ {(l.valorOrcamento || 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{maxWidth:'500px', margin:'0 auto', background:'#fff', padding:'40px', borderRadius:'30px', border: '1px solid #e4e4e7'}}>
            <h2 style={{textAlign:'center', marginBottom:'30px', fontWeight:'900'}}>Novo Lead</h2>
            <form onSubmit={handleSalvarLead} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
              <input placeholder="Nome" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} required style={inputStyle} />
              <input placeholder="Data (DD/MM às HH:MM)" value={dataManual} onChange={handleDataChange} required style={inputStyle} />
              <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={inputStyle}>
                <option value="INSTAGRAM">INSTAGRAM</option>
                <option value="FACEBOOK">FACEBOOK</option>
                <option value="SITE">SITE</option>
                <option value="OUTROS">OUTROS</option>
              </select>
              <input type="number" step="0.01" placeholder="Valor (R$)" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={inputStyle} />
              <button type="submit" disabled={isSaving} style={buttonStyle}>{isSaving ? 'SALVANDO...' : 'CADASTRAR LEAD'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e4e4e7', width: '100%', boxSizing: 'border-box', outline: 'none' };
const buttonStyle = { padding: '14px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
