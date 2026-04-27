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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DESIGN SYSTEM ---
const THEME = {
  primary: '#f97316', // Laranja Klinni
  secondary: '#09090b', // Preto
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
  
  // States Auth
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const recaptchaRef = useRef(null);

  // States Leads & Filtros
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
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // --- FUNÇÕES DE AUTH ---
  const initRecaptcha = () => {
    if (typeof window === "undefined") return;
    if (!recaptchaRef.current) {
      try {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      } catch (e) {
        console.error("Erro ao iniciar Recaptcha:", e);
      }
    }
    return recaptchaRef.current;
  };

  const handleSendCode = async () => {
    if (!phone.startsWith('+')) {
      setAuthError("Use o formato: +5571999999999");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const verifier = initRecaptcha();
      const result = await signInWithPhoneNumber(auth, phone, verifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      console.error(error);
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
    setAuthError("");
    try {
      await confirmationResult.confirm(code);
    } catch (error) {
      setAuthError("Código inválido ou expirado.");
    } finally {
      setAuthLoading(false);
    }
  };

  // --- FUNÇÕES DE LEADS ---
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
    } catch (e) {
      console.error("Erro ao atualizar status", e);
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
      console.error("Erro ao salvar lead:", err); 
    } finally { 
      setIsSaving(false); 
    }
  };

  // --- FILTROS E MÉTRICAS ---
  const filteredLeads = leads.filter(l => {
    const matchSearch = l.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValor = leads.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0);

  if (loading) return <div style={{ padding: 40, fontFamily: THEME.font }}>Carregando...</div>;

  // --- TELA DE LOGIN ---
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: `1px solid ${THEME.border}`, width: "100%", maxWidth: "360px", textAlign: 'center' }}>
          <h1 style={{ fontWeight: '900', fontSize: '24px', marginBottom: '8px' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h1>
          <p style={{ color: '#71717a', fontSize: '14px', marginBottom: '32px' }}>Acesso via número de telefone</p>
          
          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="+55 71 99999-9999" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
                style={inputStyle} 
              />
              <button onClick={handleSendCode} disabled={authLoading} style={buttonStyle}>
                {authLoading ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="Código de 6 dígitos" 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '4px' }} 
              />
              <button onClick={handleConfirmCode} disabled={authLoading} style={{...buttonStyle, background: THEME.primary}}>
                {authLoading ? "Verificando..." : "Confirmar Acesso"}
              </button>
              <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#71717a', cursor: 'pointer' }}>
                Alterar número
              </button>
            </div>
          )}
          {authError && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '16px', fontWeight: '600' }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.secondary, fontFamily: THEME.font }}>
      <nav style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h2 style={{ fontWeight: '800', fontSize: '14px' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setView('dashboard')} style={{ ...navTabStyle, background: view === 'dashboard' ? '#f4f4f5' : 'transparent' }}>Dashboard</button>
            <button onClick={() => setView('novoLead')} style={{ ...navTabStyle, background: view === 'novoLead' ? '#f4f4f5' : 'transparent' }}>+ Novo Lead</button>
          </div>
        </div>
        <button onClick={() => signOut(auth)} style={logoutBtnStyle}>Sair</button>
      </nav>

      <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
        {view === 'dashboard' ? (
          <div>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
              <div style={metricCardStyle}><span style={metricLabelStyle}>TOTAL DE LEADS</span><span style={metricValueStyle}>{leads.length}</span></div>
              <div style={metricCardStyle}><span style={metricLabelStyle}>ORÇAMENTOS</span><span style={metricValueStyle}>R$ {totalValor.toLocaleString('pt-BR')}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input placeholder="Buscar lead..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="Todos">Todos os Status</option>
                <option value="Pendente">Pendente</option>
                <option value="Agendado">Agendado</option>
                <option value="Em tratamento">Em tratamento</option>
                <option value="Não qualificado">Não qualificado</option>
              </select>
            </div>
            
            <div style={gridStyle}>
              {filteredLeads.map(l => {
                const st = STATUS_THEME[l.status] || STATUS_THEME['Pendente'];
                return (
                  <div key={l.id} style={cardLeadStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#a1a1aa' }}>{l.origem}</span>
                      <select 
                        value={l.status} 
                        onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                        style={{ background: st.bg, color: st.text, border: 'none', borderRadius: '100px', fontSize: '11px', fontWeight: '700', padding: '4px 10px', cursor: 'pointer' }}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Em tratamento">Em tratamento</option>
                        <option value="Não qualificado">Não qualificado</option>
                      </select>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700' }}>{l.nome}</h4>
                    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '20px' }}>
                      🗓️ {l.dataAgendamento || 'Sem data'}
                    </div>
                    <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: '700' }}>VALOR</span>
                      <span style={{ fontSize: '16px', fontWeight: '800' }}>R$ {l.valorOrcamento?.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={cardFormStyle}>
              <h2 style={{ fontSize: '20px', marginBottom: '32px', fontWeight: '800' }}>Novo Registro</h2>
              <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <input placeholder="Nome completo" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
                <input placeholder="Data (Ex: 25/04 às 14:00)" value={formData.dataManual} onChange={e => setFormData({...formData, dataManual: e.target.value})} style={inputStyle} />
                <select value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})} style={inputStyle}>
                  <option value="INSTAGRAM">INSTAGRAM</option>
                  <option value="FACEBOOK">FACEBOOK</option>
                  <option value="WHATSAPP">WHATSAPP</option>
                  <option value="SITE">SITE</option>
                </select>
                <input type="number" placeholder="Valor (R$)" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={inputStyle} />
                <button type="submit" disabled={isSaving} style={submitBtnStyle}>{isSaving ? 'Salvando...' : 'Criar Lead'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- ESTILOS AUXILIARES ---
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', background: '#fff', borderBottom: '1px solid #e4e4e7', position: 'sticky', top: 0, zIndex: 100 };
const navTabStyle = { padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: '0.2s' };
const logoutBtnStyle = { background: 'none', border: 'none', color: '#a1a1aa', fontSize: '12px', cursor: 'pointer', fontWeight: '600' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' };
const cardLeadStyle = { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e4e4e7', transition: 'transform 0.2s' };
const cardFormStyle = { background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e4e4e7' };
const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e4e4e7', background: '#fcfcfd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const buttonStyle = { padding: '16px', background: THEME.secondary, color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' };
const submitBtnStyle = { ...buttonStyle, background: THEME.primary, marginTop: '10px' };
const metricCardStyle = { flex: 1, background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e4e4e7' };
const metricLabelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a1aa', display: 'block', marginBottom: '4px' };
const metricValueStyle = { fontSize: '20px', fontWeight: '900' };
