import React, { useState, useEffect, useRef } from 'react';
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

// Inicialização segura para Build (SSR)
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DESIGN SYSTEM ---
const THEME = {
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  white: '#ffffff',
  font: 'Inter, -apple-system, system-ui, sans-serif'
};

const STATUS_THEME = {
  'Pendente': { bg: '#f4f4f5', text: '#71717a' },
  'Agendado': { bg: '#eff6ff', text: '#1e40af' },
  'Em tratamento': { bg: '#fff7ed', text: '#9a3412' },
  'Não qualificado': { bg: '#fef2f2', text: '#991b1b' }
};

export default function App() {
  // --- STATES ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Auth
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const recaptchaRef = useRef(null);

  // Leads & Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [formData, setFormData] = useState({
    nome: '',
    dataManual: '',
    origem: 'INSTAGRAM',
    status: 'Pendente',
    valor: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  // --- EFEITOS ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    try {
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (s) => {
        setLeads(s.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    } catch (e) {
      console.error("Erro Firestore:", e);
    }
  }, [user]);

  // --- FUNÇÕES AUTH (CLIENT-SIDE ONLY) ---
  const handleSendCode = async () => {
    if (typeof window === "undefined") return;
    if (!phone.startsWith('+')) {
      setAuthError("Use o formato: +5571999999999");
      return;
    }
    
    setAuthLoading(true);
    setAuthError("");

    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      setAuthError("Erro ao enviar SMS. Verifique o número.");
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    setAuthLoading(true);
    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      setAuthError("Código inválido.");
    } finally {
      setAuthLoading(false);
    }
  };

  // --- FUNÇÕES LEADS ---
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "leads"), {
        nome: formData.nome,
        dataAgendamento: formData.dataManual,
        origem: formData.origem,
        status: formData.status,
        valorOrcamento: parseFloat(formData.valor) || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setFormData({ nome: '', dataManual: '', origem: 'INSTAGRAM', status: 'Pendente', valor: '' });
      setView('dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // --- RENDERIZAÇÃO ---
  const filteredLeads = leads.filter(l => {
    const n = l.nome || "";
    return n.toLowerCase().includes(search.toLowerCase()) && (statusFilter === "Todos" || l.status === statusFilter);
  });

  const totalValor = leads.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0);

  if (loading) return null;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: `1px solid ${THEME.border}`, width: "100%", maxWidth: "360px" }}>
          <h2 style={{ fontWeight: '900', textAlign: 'center', marginBottom: '24px' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h2>
          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="+5571999999999" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
              <button onClick={handleSendCode} disabled={authLoading} style={buttonStyle}>{authLoading ? "Enviando..." : "Entrar com WhatsApp"}</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Código SMS" value={code} onChange={e => setCode(e.target.value)} style={inputStyle} />
              <button onClick={handleConfirmCode} disabled={authLoading} style={{...buttonStyle, background: THEME.primary}}>Confirmar</button>
              <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#71717a', cursor: 'pointer' }}>Voltar</button>
            </div>
          )}
          {authError && <p style={{ color: 'red', fontSize: '12px', marginTop: '10px', textAlign: 'center' }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <h2 style={{ fontWeight: '900', fontSize: '14px' }}>KLINNI IA</h2>
          <button onClick={() => setView('dashboard')} style={{ ...navBtn, color: view === 'dashboard' ? THEME.primary : '#71717a' }}>Dashboard</button>
          <button onClick={() => setView('novoLead')} style={{ ...navBtn, color: view === 'novoLead' ? THEME.primary : '#71717a' }}>+ Novo Lead</button>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}>Sair</button>
      </nav>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'dashboard' ? (
          <>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={metricCard}><span>Leads</span><strong>{leads.length}</strong></div>
              <div style={metricCard}><span>Total</span><strong>R$ {totalValor.toLocaleString('pt-BR')}</strong></div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <input placeholder="Filtrar..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="Todos">Todos</option>
                {Object.keys(STATUS_THEME).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {filteredLeads.map(l => (
                <div key={l.id} style={{ background: '#fff', padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#a1a1aa' }}>{l.origem}</span>
                    <select value={l.status} onChange={e => handleUpdateStatus(l.id, e.target.value)} style={{ fontSize: '10px', borderRadius: '20px', border: 'none', padding: '2px 8px', background: STATUS_THEME[l.status]?.bg || '#eee' }}>
                      {Object.keys(STATUS_THEME).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>{l.nome}</h3>
                  <div style={{ fontSize: '12px', color: '#3b82f6', marginBottom: '15px' }}>🗓️ {l.dataAgendamento}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${THEME.border}`, paddingTop: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#a1a1aa' }}>VALOR</span>
                    <span style={{ fontWeight: '800' }}>R$ {l.valorOrcamento?.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '30px', borderRadius: '24px', border: `1px solid ${THEME.border}` }}>
            <h2 style={{ marginBottom: '20px' }}>Novo Lead</h2>
            <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
              <input placeholder="Data (20/05 às 15:00)" value={formData.dataManual} onChange={e => setFormData({...formData, dataManual: e.target.value})} style={inputStyle} />
              <select value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})} style={inputStyle}>
                <option value="INSTAGRAM">Instagram</option>
                <option value="FACEBOOK">Facebook</option>
                <option value="SITE">Site</option>
              </select>
              <input type="number" placeholder="Valor R$" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={inputStyle} />
              <button type="submit" disabled={isSaving} style={{ ...buttonStyle, background: THEME.primary }}>{isSaving ? 'Salvando...' : 'Criar Lead'}</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

// --- ESTILOS ---
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e4e4e7', outline: 'none', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { padding: '14px', background: THEME.secondary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const navStyle = { display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '60px', background: '#fff', borderBottom: `1px solid ${THEME.border}`, alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 };
const navBtn = { background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const metricCard = { flex: 1, background: '#fff', padding: '15px', borderRadius: '15px', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' };
