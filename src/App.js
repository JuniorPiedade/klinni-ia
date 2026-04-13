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

  const [formData, setFormData] = useState({
    nome: '',
    dataManual: '',
    origem: 'INSTAGRAM',
    status: 'Pendente',
    valor: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { 
      setUser(u); 
      setLoading(false); 
    });
    return () => unsub();
  }, []);

  // Correção no Recaptcha para evitar múltiplas instâncias
  useEffect(() => {
    if (!user && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible"
      });
    }
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "leads"), 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );
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
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setStep("code");
    } catch (error) {
      setAuthError("Erro ao enviar SMS. Verifique o número.");
      console.error(error);
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
      setAuthError("Código inválido.");
      console.error(error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
    } catch (e) {
      console.error("Erro ao atualizar", e);
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

  const filteredLeads = leads.filter(l => {
    const matchSearch = l.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalLeads = leads.length;
  const totalValor = leads.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0);
  const agendadosCount = leads.filter(l => l.status === "Agendado").length;

  if (loading) return <div style={{ padding: 40, fontFamily: THEME.font }}>Carregando Klinni IA...</div>;

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: "1px solid #e4e4e7", width: "100%", maxWidth: "380px" }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontWeight: '900', fontSize: '24px' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h1>
          </div>

          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="+55 71 99999-9999" value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
              <button onClick={handleSendCode} disabled={authLoading} style={submitBtnStyle}>
                {authLoading ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Código de 6 dígitos" value={code} onChange={(e) => setCode(e.target.value)} style={{ ...inputStyle, textAlign: 'center', letterSpacing: '4px' }} />
              <button onClick={handleConfirmCode} disabled={authLoading} style={{ ...submitBtnStyle, background: THEME.primary }}>
                {authLoading ? "Verificando..." : "Confirmar código"}
              </button>
              <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer' }}>Voltar</button>
            </div>
          )}
          {authError && <p style={{ color: "red", fontSize: "12px", textAlign: "center", marginTop: "10px" }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={navStyle}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <h2 style={{ fontWeight: '800', fontSize: '14px' }}>KLINNI IA</h2>
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
              <div style={metricCardStyle}><span style={metricLabelStyle}>LEADS</span><span style={metricValueStyle}>{totalLeads}</span></div>
              <div style={metricCardStyle}><span style={metricLabelStyle}>TOTAL</span><span style={metricValueStyle}>R$ {totalValor.toLocaleString('pt-BR')}</span></div>
              <div style={metricCardStyle}><span style={metricLabelStyle}>AGENDADOS</span><span style={metricValueStyle}>{agendadosCount}</span></div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, flex: 2 }} />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                <option value="Todos">Todos</option>
                <option value="Pendente">Pendente</option>
                <option value="Agendado">Agendado</option>
              </select>
            </div>
            
            <div style={gridStyle}>
              {filteredLeads.map(l => (
                <div key={l.id} style={cardLeadStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800' }}>{l.origem}</span>
                    <select value={l.status} onChange={(e) => handleUpdateStatus(l.id, e.target.value)} style={{ fontSize: '11px', borderRadius: '10px', padding: '2px 8px' }}>
                      <option value="Pendente">Pendente</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Em tratamento">Em tratamento</option>
                      <option value="Não qualificado">Não qualificado</option>
                    </select>
                  </div>
                  <h4 style={{ margin: '0 0 8px 0' }}>{l.nome}</h4>
                  <p style={{ fontSize: '12px', color: '#3b82f6' }}>{l.dataAgendamento ? new Date(l.dataAgendamento).toLocaleString('pt-BR') : 'Sem data'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={cardFormStyle}>
              <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <input placeholder="Nome" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
                <input type="datetime-local" value={formData.dataManual} onChange={e => setFormData({...formData, dataManual: e.target.value})} style={inputStyle} />
                <input type="number" placeholder="Valor" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={inputStyle} />
                <button type="submit" disabled={isSaving} style={submitBtnStyle}>{isSaving ? 'Salvando...' : 'Criar Lead'}</button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const navStyle = { display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '64px', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e4e4e7' };
const navTabStyle = { padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' };
const logoutBtnStyle = { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' };
const cardLeadStyle = { background: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #e4e4e7' };
const cardFormStyle = { background: '#fff', padding: '30px', borderRadius: '20px', border: '1px solid #e4e4e7' };
const inputStyle = { padding: '12px', borderRadius: '10px', border: '1px solid #e4e4e7', width: '100%', boxSizing: 'border-box' };
const submitBtnStyle = { padding: '15px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' };
const metricCardStyle = { flex: 1, background: '#fff', padding: '20px', borderRadius: '15px', border: '1px solid #e4e4e7' };
const metricLabelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a1aa' };
const metricValueStyle = { fontSize: '18px', fontWeight: '900', display: 'block' };
