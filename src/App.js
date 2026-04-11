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

// --- DESIGN SYSTEM PREMIUM ---
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
  
  const [formData, setFormData] = useState({
    nome: '',
    dataManual: '',
    origem: 'INSTAGRAM',
    status: 'Pendente',
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
        status: formData.status,
        valorOrcamento: parseFloat(formData.valor) || 0,
        userId: user.uid,
        createdAt: serverTimestamp()
      });

      setFormData({ nome: '', dataManual: '', origem: 'INSTAGRAM', status: 'Pendente', valor: '' });
      setView('dashboard');
    } catch (err) { alert("Erro ao salvar no banco de dados."); }
    finally { setIsSaving(false); }
  };

  if (loading) return null;

  return (
    <div style={{ minHeight: '100vh', background: THEME.bg, color: THEME.text, fontFamily: THEME.font, WebkitFontSmoothing: 'antialiased' }}>
      {user && (
        <>
          <nav style={navStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
              <h2 style={{ fontWeight: '800', fontSize: '14px', letterSpacing: '-0.02em' }}>KLINNI <span style={{ color: THEME.primary }}>IA</span></h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setView('dashboard')} style={{ ...navTabStyle, background: view === 'dashboard' ? '#f4f4f5' : 'transparent', color: view === 'dashboard' ? '#09090b' : '#71717a' }}>Dashboard</button>
                <button onClick={() => setView('novoLead')} style={{ ...navTabStyle, background: view === 'novoLead' ? '#f4f4f5' : 'transparent', color: view === 'novoLead' ? '#09090b' : '#71717a' }}>+ Novo Lead</button>
              </div>
            </div>
            <button onClick={() => signOut(auth)} style={logoutBtnStyle}>Sair</button>
          </nav>

          <main style={{ padding: '48px 40px', maxWidth: '1200px', margin: '0 auto' }}>
            {view === 'dashboard' ? (
              <div>
                <header style={{ marginBottom: '32px', animation: 'fadeIn 0.5s ease' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.04em', margin: 0 }}>Pipeline de Leads</h1>
                  <p style={{ color: '#71717a', fontSize: '14px', marginTop: '4px' }}>Acompanhe o status e a qualificação de cada contato.</p>
                </header>
                
                <div style={gridStyle}>
                  {leads.map(l => (
                    <div key={l.id} style={cardLeadStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#a1a1aa', letterSpacing: '0.05em' }}>{l.origem}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '100px', background: (STATUS_THEME[l.status] || STATUS_THEME['Pendente']).bg }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: (STATUS_THEME[l.status] || STATUS_THEME['Pendente']).dot }} />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: (STATUS_THEME[l.status] || STATUS_THEME['Pendente']).text }}>{l.status}</span>
                        </div>
                      </div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '17px', fontWeight: '700', letterSpacing: '-0.02em' }}>{l.nome}</h4>
                      <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: '600', marginBottom: '20px' }}>
                        <span style={{ marginRight: '6px' }}>🗓️</span>
                        {new Date(l.dataAgendamento).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})} às {new Date(l.dataAgendamento).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                      </div>
                      <div style={{ borderTop: `1px solid #f4f4f5`, paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '10px', color: '#a1a1aa', fontWeight: '700' }}>VALOR</span>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#09090b' }}>
                          R$ {l.valorOrcamento?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#71717a', padding: '100px 0' }}>Nenhum lead encontrado.</p>}
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '480px', margin: '0 auto', animation: 'slideUp 0.4s ease' }}>
                <div style={cardFormStyle}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '32px', textAlign: 'center' }}>Novo Registro</h2>
                  <form onSubmit={handleSalvarLead} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={inputGroupStyle}>
                      <label style={labelStyle}>NOME COMPLETO</label>
                      <input placeholder="Ex: Lucas Mendes" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required style={inputStyle} />
                    </div>
                    <div style={dateBoxStyle}>
                      <label style={dateLabelStyle}>AGENDAMENTO (DIA/MÊS ÀS HORA)</label>
                      <input placeholder="00/00 às 00:00" value={formData.dataManual} onChange={e => handleMaskedData(e.target.value)} required style={dateInputStyle} />
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
                      {isSaving ? 'SALVANDO...' : 'CRIAR LEAD PREMIUM'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </main>
        </>
      )}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

// --- ESTILOS ---
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '64px', background: '#fff', borderBottom: `1px solid #e4e4e7`, position: 'sticky', top: 0, zIndex: 100 };
const navTabStyle = { padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: '0.2s' };
const logoutBtnStyle = { background: 'none', border: 'none', color: '#a1a1aa', fontSize: '12px', fontWeight: '500', cursor: 'pointer' };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' };
const cardLeadStyle = { background: '#fff', padding: '24px', borderRadius: '24px', border: `1px solid #e4e4e7`, transition: 'all 0.3s ease' };
const cardFormStyle = { background: '#fff', padding: '40px', borderRadius: '24px', border: `1px solid #e4e4e7`, boxShadow: '0 10px 40px rgba(0,0,0,0.02)' };
const inputGroupStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelStyle = { fontSize: '11px', fontWeight: '700', color: '#71717a', marginLeft: '4px', letterSpacing: '0.05em' };
const inputStyle = { padding: '14px', borderRadius: '12px', border: `1px solid #e4e4e7`, background: '#fcfcfd', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' };
const dateBoxStyle = { background: '#fff7ed', padding: '20px', borderRadius: '16px', border: '1px solid #ffedd5' };
const dateLabelStyle = { fontSize: '10px', fontWeight: '800', color: '#f97316', display: 'block', marginBottom: '8px', letterSpacing: '0.05em' };
const dateInputStyle = { width: '100%', border: 'none', background: '#fff', fontSize: '18px', fontWeight: '700', outline: 'none', padding: '8px', borderRadius: '8px', boxSizing: 'border-box' };
const submitBtnStyle = { padding: '18px', background: '#09090b', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginTop: '10px', transition: 'all 0.2s' };
