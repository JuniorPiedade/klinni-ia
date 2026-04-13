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
  serverTimestamp, 
  doc, 
  updateDoc 
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
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  text: '#09090b',
  font: 'Inter, -apple-system, system-ui, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // ✅ FIX RECAPTCHA SEGURO
  useEffect(() => {
    if (!user && step === "phone") {
      const timer = setTimeout(() => {
        if (!window.recaptchaVerifier) {
          try {
            const container = document.getElementById("recaptcha-container");
            if (!container) return;

            window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
              size: "invisible",
              callback: () => { console.log("Recaptcha verificado"); }
            });
          } catch (e) {
            console.error("Erro ao instanciar Recaptcha:", e);
          }
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, step]);

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

    if (!window.recaptchaVerifier) {
      setAuthError("Erro de inicialização. Recarregue a página.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      console.error(error);
      setAuthError("Erro ao enviar SMS. Tente novamente.");
      // ✅ RESET DO RECAPTCHA EM CASO DE ERRO
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.render().then(widgetId => {
          auth.tenantId ? window.recaptchaVerifier.reset(widgetId) : window.recaptchaVerifier.reset();
        });
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    if (!confirmationResult) return;
    setAuthLoading(true);
    setAuthError("");
    try {
      await confirmationResult.confirm(code);
      // Sucesso dispara o onAuthStateChanged automaticamente
    } catch (error) {
      setAuthError("Código inválido ou expirado.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) return <div style={{ padding: 40, fontFamily: THEME.font }}>Iniciando Klinni IA...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: `1px solid ${THEME.border}`, width: "360px" }}>
          <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>KLINNI IA</h2>
          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="+55 71 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              <button onClick={handleSendCode} disabled={authLoading} style={buttonStyle}>{authLoading ? "Enviando..." : "Enviar Código"}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Código de 6 dígitos" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
              <button onClick={handleConfirmCode} disabled={authLoading} style={{...buttonStyle, background: THEME.primary}}>Confirmar</button>
              <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Voltar</button>
            </div>
          )}
          {authError && <p style={{ color: 'red', fontSize: '12px', marginTop: '10px' }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 40px', background: '#fff', borderBottom: `1px solid ${THEME.border}` }}>
        <strong>KLINNI IA</strong>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#71717a' }}>Sair</button>
      </nav>
      <main style={{ padding: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {leads.map(l => (
            <div key={l.id} style={{ background: '#fff', padding: '20px', borderRadius: '15px', border: `1px solid ${THEME.border}` }}>
              <h4>{l.nome}</h4>
              <p style={{ fontWeight: 'bold' }}>R$ {(l.valorOrcamento || 0).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e4e4e7', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { padding: '14px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
