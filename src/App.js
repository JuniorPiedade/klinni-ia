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

// --- FIREBASE CONFIG ---
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

// --- THEME ---
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
  const [leads, setLeads] = useState([]);

  // AUTH
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // LEAD FORM (mínimo beta)
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");

  // --- AUTH LISTENER ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // --- RECAPTCHA FIX ---
  useEffect(() => {
    if (!user && step === "phone") {
      const timer = setTimeout(() => {
        if (!window.recaptchaVerifier) {
          try {
            const container = document.getElementById("recaptcha-container");
            if (!container) return;

            window.recaptchaVerifier = new RecaptchaVerifier(auth, container, {
              size: "invisible"
            });
          } catch (e) {
            console.error("Erro recaptcha:", e);
          }
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [user, step]);

  // --- CLEANUP RECAPTCHA ---
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // --- FIRESTORE ---
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "leads"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (s) => {
      setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });

  }, [user]);

  // --- SEND CODE ---
  const handleSendCode = async () => {

    const cleanPhone = phone.replace(/\s|-/g, '');

    if (!cleanPhone.startsWith('+')) {
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
      const result = await signInWithPhoneNumber(
        auth,
        cleanPhone,
        window.recaptchaVerifier
      );

      setConfirmationResult(result);
      setStep("code");
      setAuthError("Código enviado via SMS 📩");

    } catch (error) {
      console.error(error);

      setAuthError("Erro ao enviar SMS.");

      // RESET SEGURO
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }

    setAuthLoading(false);
  };

  // --- CONFIRM CODE ---
  const handleConfirmCode = async () => {

    if (!confirmationResult) {
      setAuthError("Solicite o código primeiro.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      console.error(error);
      setAuthError("Código inválido ou expirado.");
    }

    setAuthLoading(false);
  };

  // --- CREATE LEAD ---
  const handleCreateLead = async () => {
    if (!nome) return;

    await addDoc(collection(db, "leads"), {
      nome,
      valorOrcamento: parseFloat(valor) || 0,
      userId: user.uid,
      createdAt: serverTimestamp()
    });

    setNome("");
    setValor("");
  };

  if (loading) return <div style={{ padding: 40 }}>Carregando...</div>;

  // --- LOGIN UI ---
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: THEME.bg }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "20px", width: "320px" }}>

          <h2 style={{ textAlign: 'center' }}>KLINNI IA</h2>

          {step === "phone" ? (
            <>
              <input placeholder="+55 71 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle}/>
              <button onClick={handleSendCode} style={buttonStyle}>
                {authLoading ? "Enviando..." : "Enviar Código"}
              </button>
            </>
          ) : (
            <>
              <input placeholder="Código" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle}/>
              <button onClick={handleConfirmCode} style={{...buttonStyle, background: THEME.primary}}>
                Confirmar
              </button>
            </>
          )}

          {authError && <p style={{ color: 'red', fontSize: 12 }}>{authError}</p>}

          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div style={{ padding: 40, fontFamily: THEME.font }}>

      <button onClick={() => signOut(auth)}>Sair</button>

      <h2>Leads</h2>

      <input placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle}/>
      <input placeholder="Valor" value={valor} onChange={(e) => setValor(e.target.value)} style={inputStyle}/>
      <button onClick={handleCreateLead} style={buttonStyle}>Adicionar Lead</button>

      <div style={{ marginTop: 20 }}>
        {leads.map(l => (
          <div key={l.id} style={{ border: '1px solid #eee', padding: 10, marginBottom: 10 }}>
            <strong>{l.nome}</strong>
            <p>R$ {(l.valorOrcamento || 0).toLocaleString('pt-BR')}</p>
          </div>
        ))}
      </div>

    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '10px',
  borderRadius: '8px',
  border: '1px solid #ddd'
};

const buttonStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '10px',
  background: '#09090b',
  color: '#fff',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer'
};
