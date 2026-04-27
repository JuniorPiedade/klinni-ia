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

// Inicialização segura para ambiente de Build
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

// --- DESIGN SYSTEM ---
const THEME = {
  primary: '#f97316',
  secondary: '#09090b',
  bg: '#fafafa',
  border: '#e4e4e7',
  font: 'Inter, system-ui, -apple-system, sans-serif'
};

const STATUS_THEME = {
  'Pendente': { bg: '#f4f4f5', text: '#71717a' },
  'Agendado': { bg: '#eff6ff', text: '#1e40af' },
  'Em tratamento': { bg: '#fff7ed', text: '#9a3412' },
  'Não qualificado': { bg: '#fef2f2', text: '#991b1b' }
};

// --- COMPONENTE PRINCIPAL ---
export default function App() {
  // Estados de Autenticação e App
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Estados do Formulário de Login
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState("phone"); 
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  
  // Referência para o Recaptcha (Previne erros de Build e duplicação)
  const recaptchaRef = useRef(null);

  // Estados do Dashboard e Cadastro
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    dataManual: '',
    origem: 'INSTAGRAM',
    status: 'Pendente',
    valor: ''
  });

  // Monitoramento de Usuário
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Monitoramento de Leads (Firestore)
  useEffect(() => {
    if (!user) return;
    const leadsRef = collection(db, "leads");
    const q = query(
      leadsRef, 
      where("userId", "==", user.uid), 
      orderBy("createdAt", "desc")
    );

    const unsubscribeLeads = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setLeads(leadsData);
    });

    return () => unsubscribeLeads();
  }, [user]);

  // Funções de Autenticação
  const handleSendCode = async () => {
    if (typeof window === "undefined") return;
    if (!phone.startsWith('+')) {
      setAuthError("Formato inválido. Use +55...");
      return;
    }

    setAuthLoading(true);
    setAuthError("");

    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }
      const result = await signInWithPhoneNumber(auth, phone, recaptchaRef.current);
      setConfirmationResult(result);
      setStep("code");
    } catch (err) {
      console.error("Erro SMS:", err);
      setAuthError("Erro ao enviar SMS.");
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
    } catch (err) {
      setAuthError("Código incorreto.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Funções de Negócio
  const handleUpdateStatus = async (leadId, newStatus) => {
    try {
      const leadDoc = doc(db, "leads", leadId);
      await updateDoc(leadDoc, { status: newStatus });
    } catch (err) {
      console.error("Erro Status:", err);
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
      console.error("Erro Salvar:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Lógica de Filtros
  const filteredLeads = leads.filter(lead => {
    const nomeLead = lead.nome || "";
    const matchBusca = nomeLead.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || lead.status === statusFilter;
    return matchBusca && matchStatus;
  });

  const totalEmOrcamentos = leads.reduce((acc, lead) => acc + (lead.valorOrcamento || 0), 0);

  // Renderização de Segurança
  if (loading) return null;

  // Tela de Autenticação
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: THEME.bg, fontFamily: THEME.font }}>
        <div style={{ background: "#fff", padding: "40px", borderRadius: "24px", border: `1px solid ${THEME.border}`, width: "100%", maxWidth: "360px" }}>
          <h1 style={{ fontWeight: '900', fontSize: '22px', textAlign: 'center', marginBottom: '30px' }}>
            KLINNI <span style={{ color: THEME.primary }}>IA</span>
          </h1>
          
          {step === "phone" ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="+5571999999999" 
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                style={styleInput} 
              />
              <button onClick={handleSendCode} disabled={authLoading} style={styleButtonPrimary}>
                {authLoading ? "Enviando..." : "Entrar com Telefone"}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input 
                placeholder="Código de 6 dígitos" 
                value={code} 
                onChange={e => setCode(e.target.value)} 
                style={{ ...styleInput, textAlign: 'center', letterSpacing: '4px' }} 
              />
              <button onClick={handleConfirmCode} disabled={authLoading} style={{ ...styleButtonPrimary, background: THEME.primary }}>
                {authLoading ? "Validando..." : "Confirmar"}
              </button>
              <button onClick={() => setStep("phone")} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '12px', cursor: 'pointer' }}>
                Voltar
              </button>
            </div>
          )}
          {authError && <p style={{ color: 'red', fontSize: '12px', marginTop: '15px', textAlign: 'center' }}>{authError}</p>}
          <div id="recaptcha-container"></div>
        </div>
      </div>
    );
  }

  // Tela Principal (Dashboard)
  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, fontFamily: THEME.font }}>
      <nav style={styleNav}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <h2 style={{ fontWeight: '900', fontSize: '14px' }}>KLINNI IA</h2>
          <button onClick={() => setView('dashboard')} style={{ ...styleNavBtn, color: view === 'dashboard' ? THEME.primary : '#71717a' }}>Fluxo</button>
          <button onClick={() => setView('novoLead')} style={{ ...styleNavBtn, color: view === 'novoLead' ? THEME.primary : '#71717a' }}>+ Novo Lead</button>
        </div>
        <button onClick={() => signOut(auth)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px', color: '#a1a1aa' }}>Sair</button>
      </nav>

      <main style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }}>
        {view === 'dashboard' ? (
          <>
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <div style={styleMetric}>
                <span style={styleMetricLabel}>Total Leads</span>
                <strong style={styleMetricValue}>{leads.length}</strong>
              </div>
              <div style={styleMetric}>
                <span style={styleMetricLabel}>Valor em Caixa</span>
                <strong style={styleMetricValue}>R$ {totalEmOrcamentos.toLocaleString('pt-BR')}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
              <input 
                placeholder="Pesquisar por nome..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                style={{ ...styleInput, flex: 2 }} 
              />
              <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)} 
                style={{ ...styleInput, flex: 1 }}
              >
                <option value="Todos">Todos</option>
                {Object.keys(STATUS_THEME).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={styleGrid}>
              {filteredLeads.map(lead => {
                const badge = STATUS_THEME[lead.status] || STATUS_THEME['Pendente'];
                return (
                  <div key={lead.id} style={styleCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#a1a1aa' }}>{lead.origem}</span>
                      <select 
                        value={lead.status} 
                        onChange={e => handleUpdateStatus(lead.id, e.target.value)} 
                        style={{ ...styleBadge, background: badge.bg, color: badge.text }}
                      >
                        {Object.keys(STATUS_THEME).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '800' }}>{lead.nome}</h3>
                    <p style={{ fontSize: '12px', color: '#3b82f6', fontWeight: '600', marginBottom: '15px' }}>🗓️ {lead.dataAgendamento}</p>
                    <div style={styleCardFooter}>
                      <span style={{ fontSize: '10px', color: '#a1a1aa' }}>VALOR</span>
                      <span style={{ fontWeight: '900' }}>R$ {lead.valorOrcamento?.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={styleFormContainer}>
            <h2 style={{ marginBottom: '25px', fontWeight: '900' }}>Novo Registro</h2>
            <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input placeholder="Nome do Cliente" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={styleInput} />
              <input placeholder="Data/Hora (Ex: Amanhã 14h)" value={formData.dataManual} onChange={e => setFormData({...formData, dataManual: e.target.value})} style={styleInput} />
              <select value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})} style={styleInput}>
                <option value="INSTAGRAM">Instagram</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SITE">Site</option>
              </select>
              <input type="number" placeholder="Valor Estimado (R$)" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={styleInput} />
              <button type="submit" disabled={isSaving} style={{ ...styleButtonPrimary, background: THEME.primary }}>
                {isSaving ? 'Salvando...' : 'Cadastrar Lead'}
              </button>
              <button type="button" onClick={() => setView('dashboard')} style={{ background: 'none', border: 'none', fontSize: '12px', cursor: 'pointer' }}>Cancelar</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

// --- ESTILOS (OBJETOS) ---
const styleInput = { padding: '12px', borderRadius: '10px', border: '1px solid #e4e4e7', outline: 'none', width: '100%', boxSizing: 'border-box', fontSize: '14px' };
const styleButtonPrimary = { padding: '14px', background: THEME.secondary, color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' };
const styleNav = { display: 'flex', justifyContent: 'space-between', padding: '0 40px', height: '64px', background: '#fff', borderBottom: `1px solid ${THEME.border}`, alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 };
const styleNavBtn = { background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };
const styleMetric = { flex: 1, background: '#fff', padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` };
const styleMetricLabel = { fontSize: '10px', color: '#a1a1aa', fontWeight: 'bold', display: 'block' };
const styleMetricValue = { fontSize: '20px', fontWeight: '900' };
const styleGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' };
const styleCard = { background: '#fff', padding: '20px', borderRadius: '20px', border: `1px solid ${THEME.border}` };
const styleBadge = { fontSize: '10px', borderRadius: '20px', border: 'none', padding: '4px 10px', fontWeight: 'bold', cursor: 'pointer' };
const styleCardFooter = { display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${THEME.border}`, paddingTop: '15px', alignItems: 'center' };
const styleFormContainer = { maxWidth: '400px', margin: '0 auto', background: '#fff', padding: '35px', borderRadius: '24px', border: `1px solid ${THEME.border}` };
