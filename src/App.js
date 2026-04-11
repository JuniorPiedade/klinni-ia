import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";

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

// --- DESIGN SYSTEM PREMIUM (Tokens) ---
const THEME = {
  primary: '#f97316',    // Orange 600
  secondary: '#09090b',  // Zinc 950
  text: '#27272a',       // Zinc 800
  textLight: '#71717a',  // Zinc 500
  bg: '#fafafa',         // Zinc 50
  border: '#e4e4e7',     // Zinc 200
  white: '#ffffff',
  font: 'Inter, -apple-system, sans-serif'
};

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  
  // Refatoração de State: Objeto único para maior escalabilidade
  const [formData, setFormData] = useState({
    nome: '',
    dataManual: '',
    origem: 'INSTAGRAM',
    valor: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setLeads(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  // Máscara Inteligente DD/MM às HH:MM
  const handleMaskedData = (val) => {
    let v = val.replace(/\D/g, "").substring(0, 8);
    let f = "";
    if (v.length > 0) f += v.substring(0, 2);
    if (v.length > 2) f += "/" + v.substring(2, 4);
    if (v.length > 4) f += " às " + v.substring(4, 6);
    if (v.length > 6) f += ":" + v.substring(6, 8);
    setFormData(prev => ({ ...prev, dataManual: f }));
  };

  const handleSalvarLead = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const [datePart, timePart] = formData.dataManual.split(" às ");
      const [dia, mes] = datePart.split("/");
      const [hora, min] = timePart.split(":");
      const dataISO = `${new Date().getFullYear()}-${mes}-${dia}T${hora}:${min}:00`;

      await addDoc(collection(db, "leads"), {
        nome: formData.nome,
        dataAgendamento: dataISO,
        origem: formData.origem,
        valorOrcamento: parseFloat(formData.valor) || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setFormData({ nome: '', dataManual: '', origem: 'INSTAGRAM', valor: '' });
      setView('dashboard');
    } catch (err) { alert("Erro na persistência dos dados."); }
    finally { setIsSaving(false); }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font, WebkitFontSmoothing: 'antialiased' }}>
      {user && (
        <>
          {/* Navegação Estilo Stripe/Linear */}
          <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${THEME.border}`, position: 'sticky', top: 0, zIndex: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>Klinni <span style={{ color: THEME.primary }}>IA</span></h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <NavTab active={view === 'dashboard'} onClick={() => setView('dashboard')}>Dashboard</NavTab>
                <NavTab active={view === 'novoLead'} onClick={() => setView('novoLead')}>Leads</NavTab>
              </div>
            </div>
            <button onClick={() => signOut(auth)} style={{ background: 'none', border: 'none', color: THEME.textLight, fontSize: '12px', fontWeight: '500', cursor: 'pointer' }}>Sair</button>
          </nav>

          <main style={{ padding: '48px 40px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {view === 'dashboard' ? (
              <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
                <header style={{ marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '24px', fontWeight: '700', tracking: '-0.03em' }}>Visão Geral</h1>
                  <p style={{ color: THEME.textLight, fontSize: '14px' }}>Gerencie seus agendamentos e leads de alto ticket.</p>
                </header>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                  {leads.map(l => (
                    <LeadCard key={l.id} lead={l} />
                  ))}
                  {leads.length === 0 && <p style={{ color: THEME.textLight, fontSize: '14px', gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>Nenhum lead encontrado.</p>}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '480px', margin: '0 auto', animation: 'slideUp 0.3s ease-out' }}>
                <div style={{ background: THEME.white, padding: '40px', borderRadius: '24px', border: `1px solid ${THEME.border}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>Novo Lead</h2>
                  
                  <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <InputGroup label="NOME DO CLIENTE">
                      <input 
                        placeholder="Ex: Guilherme Arantes" 
                        value={formData.nome} 
                        onChange={e => setFormData({...formData, nome: e.target.value})} 
                        required 
                        style={inputStyle} 
                      />
                    </InputGroup>

                    <div style={{ background: '#fff7ed', padding: '24px', borderRadius: '16px', border: '1px solid #ffedd5' }}>
                      <label style={{ fontSize: '10px', fontWeight: '800', color: THEME.primary, display: 'block', marginBottom: '12px', letterSpacing: '0.05em' }}>AGENDAMENTO (DIA/MÊS ÀS HORA)</label>
                      <input 
                        placeholder="00/00 às 00:00" 
                        value={formData.dataManual} 
                        onChange={e => handleMaskedData(e.target.value)} 
                        required 
                        style={{ ...inputStyle, background: '#fff', fontSize: '18px', fontWeight: '700' }} 
                      />
                    </div>

                    <InputGroup label="ORIGEM">
                      <select 
                        value={formData.origem} 
                        onChange={e => setFormData({...formData, origem: e.target.value})} 
                        style={{ ...inputStyle, cursor: 'pointer' }}
                      >
                        <option value="INSTAGRAM">INSTAGRAM</option>
                        <option value="FACEBOOK">FACEBOOK</option>
                        <option value="SITE">SITE</option>
                        <option value="OUTROS">OUTROS</option>
                      </select>
                    </InputGroup>

                    <InputGroup label="VALOR ESTIMADO (R$)">
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
                        value={formData.valor} 
                        onChange={e => setFormData({...formData, valor: e.target.value})} 
                        style={inputStyle} 
                      />
                    </InputGroup>

                    <button 
                      type="submit" 
                      disabled={isSaving} 
                      style={{ 
                        padding: '18px', 
                        background: THEME.secondary, 
                        color: THEME.white, 
                        border: 'none', 
                        borderRadius: '12px', 
                        fontWeight: '700', 
                        fontSize: '14px',
                        cursor: 'pointer',
                        marginTop: '8px',
                        transition: 'opacity 0.2s'
                      }}
                    >
                      {isSaving ? 'PROCESSANDO...' : 'CONFIRMAR CADASTRO'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
    </div>
  );
}

// --- SUBCOMPONENTES (UI ATOMS) ---

const NavTab = ({ children, active, onClick }) => (
  <button 
    onClick={onClick} 
    style={{ 
      padding: '8px 16px', 
      borderRadius: '8px', 
      border: 'none', 
      background: active ? '#f4f4f5' : 'transparent', 
      color: active ? THEME.secondary : THEME.textLight, 
      fontWeight: '600', 
      fontSize: '13px', 
      cursor: 'pointer',
      transition: '0.2s'
    }}
  >
    {children}
  </button>
);

const LeadCard = ({ lead }) => (
  <div style={{ background: THEME.white, padding: '24px', borderRadius: '20px', border: `1px solid ${THEME.border}`, transition: 'transform 0.2s', position: 'relative' }}>
    <span style={{ fontSize: '10px', fontWeight: '800', color: THEME.primary, letterSpacing: '0.05em' }}>{lead.origem}</span>
    <h4 style={{ margin: '8px 0 12px 0', fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em' }}>{lead.nome}</h4>
    <div style={{ fontSize: '13px', color: '#2563eb', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{opacity: 0.8}}>🗓️</span> 
      {new Date(lead.dataAgendamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} às {new Date(lead.dataAgendamento).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
    </div>
    <div style={{ borderTop: `1px solid ${THEME.bg}`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <span style={{ fontSize: '10px', color: THEME.textLight, fontWeight: '700' }}>ORÇAMENTO</span>
      <span style={{ fontSize: '18px', fontWeight: '800', color: THEME.secondary }}>
        R$ {lead.valorOrcamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    </div>
  </div>
);

const InputGroup = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <label style={{ fontSize: '11px', fontWeight: '700', color: THEME.textLight, marginLeft: '4px' }}>{label}</label>
    {children}
  </div>
);

const inputStyle = {
  padding: '14px 16px',
  borderRadius: '12px',
  border: `1px solid ${THEME.border}`,
  background: '#fcfcfd',
  fontSize: '14px',
  color: THEME.secondary,
  outline: 'none',
  transition: 'border-color 0.2s'
};
