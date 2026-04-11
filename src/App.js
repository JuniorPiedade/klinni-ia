import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp, doc, updateDoc } from "firebase/firestore";

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
  'Pendente': { bg: '#f4f4f5', text: '#71717a', dot: '#a1a1aa' },
  'Agendado': { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' },
  'Em tratamento': { bg: '#fff7ed', text: '#9a3412', dot: '#f97316' },
  'Não qualificado': { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' }
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // States Funcionalidades Beta
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  
  // States Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // States Form
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

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setAuthError('Credenciais inválidas.');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "leads", id), { status: newStatus });
    } catch (e) {
      console.error("Erro ao atualizar status", e);
    }
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
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

  // Lógica de Filtros
  const filteredLeads = leads.filter(l => {
    const matchSearch = l.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Métricas
  const totalLeads = leads.length;
  const totalValor = leads.reduce((acc, l) => acc + (l.valorOrcamento || 0), 0);
  const agendadosCount = leads.filter(l => l.status === "Agendado").length;

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: THEME.bg, color: THEME.textLight }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '24px', height: '24px', border: '3px solid #e4e4e7', borderTopColor: THEME.primary, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
        <span style={{ fontSize: '14px', fontWeight: '600' }}>Carregando Klinni...</span>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: THEME.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: THEME.font }}>
        <div style={{ width: '100%', maxWidth: '400px', padding: '40px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontWeight: '900', fontSize: '24px', letterSpacing: '-0.04em' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h1>
            <p style={{ color: '#71717a', fontSize: '14px', marginTop: '8px' }}>Login Beta</p>
          </div>
          <form onSubmit={handleLogin} style={authFormStyle}>
            <div style={inputGroupStyle}><label style={labelStyle}>E-MAIL</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required style={inputStyle} />
            </div>
            <div style={inputGroupStyle}><label style={labelStyle}>SENHA</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inputStyle} />
            </div>
            {authError && <p style={{ color: '#ef4444', fontSize: '12px', textAlign: 'center' }}>{authError}</p>}
            <button type="submit" style={submitBtnStyle}>ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font }}>
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
            {/* 4. MINI DASHBOARD */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>TOTAL DE LEADS</span>
                <span style={metricValueStyle}>{totalLeads}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>TOTAL EM ORÇAMENTOS</span>
                <span style={metricValueStyle}>R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={metricCardStyle}>
                <span style={metricLabelStyle}>AGENDADOS</span>
                <span style={metricValueStyle}>{agendadosCount}</span>
              </div>
            </div>

            {/* 2 & 3. BUSCA E FILTRO */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
              <input 
                placeholder="Buscar lead por nome..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                style={{ ...inputStyle, flex: 2 }} 
              />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                style={{ ...inputStyle, flex: 1 }}
              >
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', color: '#a1a1aa' }}>{l.origem}</span>
                      {/* 1. ATUALIZAÇÃO DE STATUS NO CARD */}
                      <select 
                        value={l.status} 
                        onChange={(e) => handleUpdateStatus(l.id, e.target.value)}
                        style={{ 
                          background: st.bg, 
                          color: st.text, 
                          border: 'none', 
                          borderRadius: '100px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '4px 10px', 
                          outline: 'none', 
                          cursor: 'pointer' 
                        }}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Agendado">Agendado</option>
                        <option value="Em tratamento">Em tratamento</option>
                        <option value="Não qualificado">Não qualificado</option>
                      </select>
                    </div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700' }}>{l.nome}</h4>
                    <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '20px' }}>
                      🗓️ {l.dataAgendamento ? new Date(l.dataAgendamento).toLocaleString('pt-BR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}) : 'Sem data'}
                    </div>
                    <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: '16px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: '700' }}>VALOR</span>
                      <span style={{ fontSize: '16px', fontWeight: '800' }}>R$ {l.valorOrcamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )
              })}
              {/* 6. EMPTY STATE */}
              {filteredLeads.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', color: '#71717a' }}>
                  <p style={{ fontSize: '16px', fontWeight: '500' }}>Você ainda não tem leads. Clique em "+ Novo Lead" para começar.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <div style={cardFormStyle}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>Novo Registro</h2>
              <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>NOME COMPLETO</label>
                  <input placeholder="Ex: Lucas Mendes" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
                </div>
                {/* 8. INPUT DE DATA SIMPLIFICADO */}
                <div style={dateBoxStyle}>
                  <label style={dateLabelStyle}>AGENDAMENTO</label>
                  <input 
                    type="datetime-local" 
                    value={formData.dataManual} 
                    onChange={(e) => setFormData({...formData, dataManual: e.target.value})} 
                    required 
                    style={dateInputStyle} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ ...inputGroupStyle, flex: 1 }}>
                    <label style={labelStyle}>STATUS INICIAL</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={inputStyle}>
                      <option value="Pendente">Pendente</option>
                      <option value="Agendado">Agendado</option>
                      <option value="Em tratamento">Em tratamento</option>
                      <option value="Não qualificado">Não qualificado</option>
                    </select>
                  </div>
                  <div style={{ ...inputGroupStyle, flex: 1 }}>
                    <label style={labelStyle}>ORIGEM</label>
                    <select value={formData.origem} onChange={e => setFormData({...formData, origem: e.target.value})} style={inputStyle}>
                      <option value="INSTAGRAM">INSTAGRAM</option>
                      <option value="FACEBOOK">FACEBOOK</option>
                      <option value="SITE">SITE</option>
                    </select>
                  </div>
                </div>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>ORÇAMENTO ESTIMADO (R$)</label>
                  <input type="number" step="0.01" placeholder="0,00" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} style={inputStyle} />
                </div>
                <button type="submit" disabled={isSaving} style={submitBtnStyle}>
                  {isSaving ? 'SALVANDO...' : 'CRIAR LEAD'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// --- ESTILOS ---
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', background: '#fff', borderBottom: '1px solid #e4e4e7', position: 'sticky', top: 0, zIndex: 100 };
const navTabStyle = { padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer' };
const logoutBtnStyle = { background: 'none', border: 'none', color: '#a1a1aa', fontSize: '12px', fontWeight: '500', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' };
const cardLeadStyle = { background: '#fff', padding: '24px', borderRadius: '24px', border: '1px solid #e4e4e7' };
const cardFormStyle = { background: '#fff', padding: '40px', borderRadius: '24px', border: '1px solid #e4e4e7' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#71717a', marginLeft: '4px' };
const inputStyle = { padding: '14px', borderRadius: '12px', border: '1px solid #e4e4e7', background: '#fcfcfd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const dateBoxStyle = { background: '#fff7ed', padding: '20px', borderRadius: '16px', border: '1px solid #ffedd5' };
const dateLabelStyle = { fontSize: '10px', fontWeight: '800', color: '#f97316', display: 'block', marginBottom: '8px' };
const dateInputStyle = { width: '100%', border: 'none', background: '#fff', fontSize: '15px', fontWeight: '700', outline: 'none', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' };
const submitBtnStyle = { padding: '18px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px' };
const authFormStyle = { display: 'flex', flexDirection: 'column', gap: '20px', background: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #e4e4e7' };
const metricCardStyle = { flex: 1, background: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e4e4e7', display: 'flex', flexDirection: 'column', gap: '5px' };
const metricLabelStyle = { fontSize: '10px', fontWeight: '800', color: '#a1a1aa', letterSpacing: '0.05em' };
const metricValueStyle = { fontSize: '18px', fontWeight: '900', color: '#09090b' };
