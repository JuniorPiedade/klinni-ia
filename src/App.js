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
  font: 'Inter, system-ui, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [formData, setFormData] = useState({ nome: '', dataManual: '', origem: 'INSTAGRAM', status: 'Pendente', valor: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // Inicialização segura do Recaptcha
  useEffect(() => {
    if (!user && !loading) {
      const initRecaptcha = () => {
        if (!window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
              size: "invisible",
              callback: () => { console.log("Recaptcha resolvido"); }
            });
          } catch (e) {
            console.error("Erro Recaptcha:", e);
          }
        }
      };
      
      // Pequeno delay para garantir que a div #recaptcha-container está no DOM
      const timer = setTimeout(initRecaptcha, 500);
      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    } catch (e) { console.error("Erro Firestore:", e); }
  }, [user]);

  const handleSendCode = async () => {
    if (!phone.startsWith('+')) { setAuthError("Formato: +5571999999999"); return; }
    setAuthLoading(true);
    setAuthError("");
    try {
      const verifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      setAuthError("Erro ao enviar SMS.");
      console.error(error);
      if (window.recaptchaVerifier) window.recaptchaVerifier.render().then(id => window.recaptchaVerifier.reset(id));
    } finally { setAuthLoading(false); }
  };

  const handleConfirmCode = async () => {
    setAuthLoading(true);
    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      setAuthError("Código inválido.");
    } finally { setAuthLoading(false); }
  };

  const filteredLeads = Array.isArray(leads) ? leads.filter(l => {
    const nome = l.nome || "";
    return nome.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "Todos" || l.status === statusFilter);
  }) : [];

  if (loading) return <div style={{ padding: 40, textAlign: 'center', fontFamily: THEME.font }}>Iniciando Klinni IA...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "20px", border: "1px solid #e4e4e7", width: "100%", maxWidth: "360px" }}>
          <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>KLINNI IA</h2>
          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="+55 71 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              <button onClick={handleSendCode} disabled={authLoading} style={submitBtnStyle}>{authLoading ? "Enviando..." : "Enviar código"}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Código SMS" value={code} onChange={(e) => setCode(e.target.value)} style={inputStyle} />
              <button onClick={handleConfirmCode} disabled={authLoading} style={submitBtnStyle}>Confirmar</button>
              <button onClick={() => setStep("phone")} style={{ fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>Voltar</button>
            </div>
          )}
          {authError && <p style={{ color: "red", fontSize: "12px", marginTop: "10px" }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 40px', background: '#fff', borderBottom: '1px solid #e4e4e7' }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <strong>KLINNI IA</strong>
          <button onClick={() => setView('dashboard')} style={{ border: 'none', background: view === 'dashboard' ? '#f4f4f5' : 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '6px' }}>Dashboard</button>
          <button onClick={() => setView('novoLead')} style={{ border: 'none', background: view === 'novoLead' ? '#f4f4f5' : 'none', padding: '8px 12px', cursor: 'pointer', borderRadius: '6px' }}>+ Lead</button>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#71717a' }}>Sair</button>
      </nav>

      <main style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
        {view === 'dashboard' ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
              <div style={cardLeadStyle}>Leads: {leads.length}</div>
              <div style={cardLeadStyle}>R$: {leads.reduce((acc, l) => acc + (Number(l.valorOrcamento) || 0), 0).toLocaleString()}</div>
              <div style={cardLeadStyle}>Agendados: {leads.filter(l => l.status === 'Agendado').length}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
              {filteredLeads.map(l => (
                <div key={l.id} style={cardLeadStyle}>
                  <strong>{l.nome}</strong>
                  <p style={{ fontSize: '13px', color: THEME.primary }}>{l.status}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={cardLeadStyle}>
             <h3>Novo Lead</h3>
             <form onSubmit={(e) => {
               e.preventDefault();
               handleSalvarLead(e);
             }} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
               <input placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
               <input type="number" placeholder="Valor" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={inputStyle} />
               <button type="submit" disabled={isSaving} style={submitBtnStyle}>Salvar</button>
             </form>
          </div>
        )}
      </main>
    </div>
  );
}

const inputStyle = { padding: '12px', borderRadius: '8px', border: '1px solid #e4e4e7', width: '100%', boxSizing: 'border-box' };
const submitBtnStyle = { padding: '12px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const cardLeadStyle = { background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e4e4e7' };
