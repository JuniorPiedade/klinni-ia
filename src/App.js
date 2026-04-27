import React, { useState, useEffect, useRef } from 'react';
import { initializeApp, getApps } from "firebase/app";
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

// Inicialização "Anti-Erro" para o Vercel
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// --- DESIGN SYSTEM ---
const THEME = {
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  text: '#27272a',
  font: '"Inter", system-ui, sans-serif'
};

const STATUS_STYLE = {
  'Pendente': { bg: '#f4f4f5', color: '#71717a' },
  'Agendado': { bg: '#eff6ff', color: '#1d4ed8' },
  'Em tratamento': { bg: '#fff7ed', color: '#c2410c' },
  'Não qualificado': { bg: '#fef2f2', color: '#b91c1c' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Auth States
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const recaptchaRef = useRef(null);

  // Form States
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({ nome: '', data: '', origem: 'Instagram', valor: '' });

  // Monitorar Login
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Monitorar Dados (Firestore)
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Autenticação SMS
  const handleSendSMS = async () => {
    if (typeof window === "undefined") return;
    setAuthLoading(true);
    setError("");
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-anchor', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setConfirmationResult(result);
      setStep("code");
    } catch (err) {
      setError("Erro ao enviar SMS. Use o formato +55...");
      if (recaptchaRef.current) { recaptchaRef.current.clear(); recaptchaRef.current = null; }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setAuthLoading(true);
    try {
      await confirmationResult.confirm(code);
    } catch (err) { setError("Código inválido."); }
    finally { setAuthLoading(false); }
  };

  // Lógica de Negócio
  const handleAddLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "leads"), {
        ...formData,
        status: 'Pendente',
        valor: parseFloat(formData.valor) || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      });
      setFormData({ nome: '', data: '', origem: 'Instagram', valor: '' });
      setView('dashboard');
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const updateStatus = async (id, newStatus) => {
    await updateDoc(doc(db, "leads", id), { status: newStatus });
  };

  if (loading) return null;

  // VIEW: LOGIN
  if (!user) {
    return (
      <div style={styles.centerPage}>
        <div style={styles.authCard}>
          <h1 style={styles.logo}>KLINNI <span style={{color: THEME.primary}}>IA</span></h1>
          <p style={styles.sub}>CRM de Estética & Saúde</p>
          
          {step === "phone" ? (
            <div style={styles.flexCol}>
              <input style={styles.input} placeholder="+55 (DDD) 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
              <button style={styles.btnMain} onClick={handleSendSMS} disabled={authLoading}>
                {authLoading ? "Enviando..." : "Entrar com WhatsApp"}
              </button>
            </div>
          ) : (
            <div style={styles.flexCol}>
              <input style={{...styles.input, textAlign: 'center', letterSpacing: '4px'}} placeholder="Código SMS" value={code} onChange={e => setCode(e.target.value)} />
              <button style={{...styles.btnMain, background: THEME.primary}} onClick={handleVerifyCode} disabled={authLoading}>
                {authLoading ? "Aguarde..." : "Confirmar Código"}
              </button>
              <button style={styles.btnLink} onClick={() => setStep("phone")}>Mudar número</button>
            </div>
          )}
          {error && <p style={styles.error}>{error}</p>}
          <div id="recaptcha-anchor"></div>
        </div>
      </div>
    );
  }

  // VIEW: DASHBOARD / NOVO LEAD
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={styles.nav}>
        <div style={styles.navContent}>
          <div style={styles.navBrand}>KLINNI IA</div>
          <div style={styles.navLinks}>
            <button onClick={() => setView('dashboard')} style={{...styles.navBtn, color: view === 'dashboard' ? THEME.primary : '#71717a'}}>Dashboard</button>
            <button onClick={() => setView('novo')} style={{...styles.navBtn, color: view === 'novo' ? THEME.primary : '#71717a'}}>+ Novo Lead</button>
          </div>
          <button style={styles.btnExit} onClick={() => signOut(auth)}>Sair</button>
        </div>
      </nav>

      <main style={styles.main}>
        {view === 'dashboard' ? (
          <>
            <div style={styles.headerRow}>
              <div style={styles.statBox}><label>Total de Leads</label><strong>{leads.length}</strong></div>
              <div style={styles.statBox}><label>Volume Orçado</label><strong>R$ {leads.reduce((a, b) => a + (b.valor || 0), 0).toLocaleString('pt-BR')}</strong></div>
            </div>

            <input style={styles.search} placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} />

            <div style={styles.grid}>
              {leads.filter(l => l.nome.toLowerCase().includes(search.toLowerCase())).map(lead => {
                const badge = STATUS_STYLE[lead.status] || STATUS_STYLE['Pendente'];
                return (
                  <div key={lead.id} style={styles.card}>
                    <div style={styles.cardTop}>
                      <span style={styles.origem}>{lead.origem}</span>
                      <select 
                        value={lead.status} 
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        style={{...styles.status, background: badge.bg, color: badge.color}}
                      >
                        {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <h3 style={styles.nome}>{lead.nome}</h3>
                    <p style={styles.data}>🗓️ {lead.data || 'Sem data'}</p>
                    <div style={styles.cardFooter}>
                      <span style={styles.fLabel}>VALOR</span>
                      <span style={styles.fValue}>R$ {lead.valor?.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={styles.formContainer}>
            <div style={styles.formCard}>
              <h2 style={{fontWeight: 800, marginBottom: 20}}>Novo Registro</h2>
              <form onSubmit={handleAddLead} style={styles.flexCol}>
                <input style={styles.input} placeholder="Nome do Cliente" required value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <input style={styles.input} placeholder="Data (Ex: Amanhã 10h)" value={formData.data} onChange={e => setFormData({...formData, data: e.target.value})} />
                <select style={styles.input} value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})}>
                  <option value="Instagram">Instagram</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Indicação">Indicação</option>
                </select>
                <input style={styles.input} type="number" placeholder="Valor Estimado (R$)" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} />
                <button type="submit" disabled={isSaving} style={{...styles.btnMain, background: THEME.primary}}>{isSaving ? 'Gravando...' : 'Salvar Lead'}</button>
                <button type="button" style={styles.btnLink} onClick={() => setView('dashboard')}>Cancelar</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  centerPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, fontFamily: THEME.font },
  authCard: { background: '#fff', padding: 40, borderRadius: 28, border: `1px solid ${THEME.border}`, width: '100%', maxWidth: 360, textAlign: 'center' },
  logo: { fontWeight: 900, fontSize: 24, marginBottom: 5 },
  sub: { color: '#71717a', fontSize: 13, marginBottom: 30 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${THEME.border}`, outline: 'none', boxSizing: 'border-box' },
  btnMain: { width: '100%', padding: 14, borderRadius: 12, border: 'none', background: THEME.secondary, color: '#fff', fontWeight: 700, cursor: 'pointer', marginTop: 10 },
  btnLink: { background: 'none', border: 'none', color: '#71717a', fontSize: 12, cursor: 'pointer', marginTop: 15 },
  error: { color: '#ef4444', fontSize: 12, marginTop: 10 },
  nav: { height: 60, background: '#fff', borderBottom: `1px solid ${THEME.border}`, display: 'flex', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 },
  navContent: { maxWidth: 1000, width: '100%', margin: '0 auto', display: 'flex', justifyContent: 'space-between', padding: '0 20px', alignItems: 'center' },
  navBrand: { fontWeight: 900, fontSize: 14 },
  navLinks: { display: 'flex', gap: 20 },
  navBtn: { background: 'none', border: 'none', fontWeight: 800, fontSize: 12, cursor: 'pointer' },
  btnExit: { background: 'none', border: 'none', color: '#a1a1aa', fontSize: 11, cursor: 'pointer' },
  main: { maxWidth: 1000, margin: '0 auto', padding: '30px 20px' },
  headerRow: { display: 'flex', gap: 15, marginBottom: 30 },
  statBox: { flex: 1, background: '#fff', padding: 20, borderRadius: 20, border: `1px solid ${THEME.border}` },
  search: { width: '100%', padding: 15, borderRadius: 15, border: `1px solid ${THEME.border}`, marginBottom: 25, outline: 'none' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 },
  card: { background: '#fff', padding: 20, borderRadius: 24, border: `1px solid ${THEME.border}` },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 15 },
  origem: { fontSize: 9, fontWeight: 900, color: '#a1a1aa', textTransform: 'uppercase' },
  status: { border: 'none', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 800, cursor: 'pointer' },
  nome: { margin: '0 0 5px 0', fontSize: 16, fontWeight: 800 },
  data: { fontSize: 11, fontWeight: 700, color: '#3b82f6', marginBottom: 15 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', borderTop: `1px solid #f4f4f5`, paddingTop: 12, alignItems: 'center' },
  fLabel: { fontSize: 9, color: '#a1a1aa', fontWeight: 800 },
  fValue: { fontSize: 14, fontWeight: 900 },
  flexCol: { display: 'flex', flexDirection: 'column', gap: 12 },
  formContainer: { display: 'flex', justifyContent: 'center' },
  formCard: { background: '#fff', padding: 35, borderRadius: 28, border: `1px solid ${THEME.border}`, width: '100%', maxWidth: 400 }
};
