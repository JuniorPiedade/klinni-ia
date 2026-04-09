import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, onSnapshot, serverTimestamp, doc, updateDoc, limit } from "firebase/firestore";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyCv7kNOOa1AT71TmvwKLdwi8TyHHVh6htM",
  authDomain: "klinni-ia.firebaseapp.com",
  projectId: "klinni-ia",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const theme = {
  primary: "#f97316",
  text: "#0f172a",
  gray: "#64748b",
  bg: "#f8fafc",
  card: "#ffffff",
  shadow: "0 10px 15px -3px rgba(0, 0, 0, 0.04)"
};

const COLunas = ['Aberto', 'Agendado', 'Em tratamento', 'Não qualificado'];
const ORIGENS = ['Todos', 'Instagram', 'Facebook', 'WhatsApp', 'Site'];

// --- ÍCONES ---
const IconSearch = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconLayout = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [leads, setLeads] = useState([]);
  const [filtroBusca, setFiltroBusca] = useState('');
  const [filtroOrigem, setFiltroOrigem] = useState('Todos');

  // Form States Completos
  const [idEditando, setIdEditando] = useState(null);
  const [nomeLead, setNomeLead] = useState('');
  const [telLead, setTelLead] = useState('');
  const [valorOrcamento, setValorOrcamento] = useState('');
  const [cepLead, setCepLead] = useState('');
  const [idadeLead, setIdadeLead] = useState('');
  const [origemLead, setOrigemLead] = useState('Instagram');
  const [notasLead, setNotasLead] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "leads"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snaps) => setLeads(snaps.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => unsub();
  }, [user]);

  // Drag & Drop
  const onDragStart = (e, id) => e.dataTransfer.setData("leadId", id);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = async (e, novoStatus) => {
    const id = e.dataTransfer.getData("leadId");
    await updateDoc(doc(db, "leads", id), { status: novoStatus });
  };

  const totalOrcamentos = leads
    .filter(l => l.status !== 'Não qualificado')
    .reduce((acc, curr) => acc + (parseFloat(curr.valor?.replace(/[^\d,]/g, '').replace(',', '.')) || 0), 0);

  const handleSalvar = async (e) => {
    e.preventDefault();
    const payload = { 
      nome: nomeLead, telefone: telLead, valor: valorOrcamento, 
      cep: cepLead, idade: idadeLead, origem: origemLead, 
      notas: notasLead, userId: user.uid, status: idEditando ? leads.find(l=>l.id===idEditando).status : 'Aberto' 
    };
    if (idEditando) await updateDoc(doc(db, "leads", idEditando), payload);
    else await addDoc(collection(db, "leads"), { ...payload, createdAt: serverTimestamp() });
    setIdEditando(null); setView('dashboard');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme.bg, fontFamily: '"Inter", sans-serif' }}>
      <style>{`
        .origin-btn { cursor: pointer; padding: 8px 14px; border-radius: 10px; border: 1px solid #e2e8f0; background: #fff; font-size: 11px; font-weight: 800; color: ${theme.gray}; transition: 0.2s; }
        .origin-btn.active { border-color: ${theme.primary}; background: ${theme.primary}10; color: ${theme.primary}; }
        .kanban-column { min-width: 290px; flex: 1; background: #f1f5f9; border-radius: 20px; padding: 15px; min-height: 70vh; }
        .search-bar { display: flex; align-items: center; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0 12px; width: 280px; }
        .search-bar input { border: none; padding: 10px; outline: none; font-size: 13px; width: 100%; }
        .lead-card { background: #fff; padding: 16px; border-radius: 15px; box-shadow: ${theme.shadow}; cursor: grab; }
      `}</style>

      {/* SIDEBAR */}
      <aside style={{ width: 260, background: '#fff', borderRight: '1px solid #e2e8f0', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '35px 25px' }}><h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>KLINNI <span style={{ color: theme.primary }}>IA</span></h2></div>
        <nav style={{ padding: '0 15px' }}>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: view === 'dashboard' ? `${theme.primary}10` : 'transparent', color: view === 'dashboard' ? theme.primary : theme.gray, fontWeight: 700, cursor: 'pointer', marginBottom: 5 }}><IconLayout /> Dashboard</button>
          <button onClick={() => setView('dashboard')} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderRadius: 12, border: 'none', background: 'transparent', color: theme.gray, fontWeight: 700, cursor: 'pointer' }}><IconUsers /> Meus Leads</button>
        </nav>
        <div style={{ padding: 20, position: 'absolute', bottom: 0, width: '100%' }}>
          <button onClick={() => { setIdEditando(null); setView('novoLead'); }} style={{ width: '100%', padding: '14px', background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer' }}>+ Novo Lead</button>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 260, padding: '40px' }}>
        {view === 'dashboard' ? (
          <div>
            {/* TOP FILTERS & REVENUE */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 35, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {ORIGENS.map(o => <button key={o} className={`origin-btn ${filtroOrigem===o?'active':''}`} onClick={()=>setFiltroOrigem(o)}>{o.toUpperCase()}</button>)}
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 10, fontWeight: 900, color: theme.gray }}>TOTAL EM NEGOCIAÇÃO</span>
                <div style={{ fontSize: 22, fontWeight: 900, color: theme.text }}>{totalOrcamentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
            </div>

            {/* HEADER: DASHBOARD + SEARCH */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 25, marginBottom: 30 }}>
              <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: theme.text }}>
                <span style={{ color: theme.primary }}>DASH</span>BOARD
              </h1>
              <div className="search-bar"><IconSearch /><input placeholder="Buscar paciente..." onChange={e => setFiltroBusca(e.target.value)} /></div>
            </div>

            {/* KANBAN BOARD */}
            <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 20 }}>
              {COLunas.map(col => (
                <div key={col} className="kanban-column" onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 15, borderBottom: '2px solid #cbd5e1', marginBottom: 20 }}>
                    <span style={{ fontWeight: 800, fontSize: 11 }}>{col.toUpperCase()}</span>
                    <span style={{ fontSize: 11, fontWeight: 900, color: theme.gray }}>{leads.filter(l => l.status === col).length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                    {leads
                      .filter(l => l.status === col && (filtroOrigem === 'Todos' || l.origem === filtroOrigem) && l.nome.toLowerCase().includes(filtroBusca.toLowerCase()))
                      .map(l => (
                        <div key={l.id} draggable onDragStart={(e) => onDragStart(e, l.id)} className="lead-card">
                          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{l.nome}</div>
                          <div style={{ color: theme.primary, fontWeight: 800, fontSize: 14 }}>{l.valor}</div>
                          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 9, fontWeight: 900, color: theme.gray }}>{l.origem?.toUpperCase()}</span>
                            <button onClick={()=>{ setIdEditando(l.id); setNomeLead(l.nome); setValorOrcamento(l.valor); setTelLead(l.telefone); setCepLead(l.cep); setIdadeLead(l.idade); setOrigemLead(l.origem); setNotasLead(l.notas); setView('novoLead'); }} style={{ border: 'none', background: 'none', fontSize: 9, fontWeight: 900, color: theme.gray, cursor: 'pointer' }}>EDITAR</button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 500, margin: '0 auto', background: '#fff', padding: '40px', borderRadius: 25, boxShadow: theme.shadow }}>
            <h2 style={{ marginBottom: 30, fontWeight: 800 }}>{idEditando ? 'Editar' : 'Novo'} Lead</h2>
            <form onSubmit={handleSalvar} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
              <input required placeholder="Nome Completo" value={nomeLead} onChange={e=>setNomeLead(e.target.value)} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }} />
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="WhatsApp" value={telLead} onChange={e=>setTelLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <input placeholder="Valor Orçamento" value={valorOrcamento} onChange={e=>setValorOrcamento(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input placeholder="CEP" value={cepLead} onChange={e=>setCepLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }} />
                <input placeholder="Idade" type="number" value={idadeLead} onChange={e=>setIdadeLead(e.target.value)} style={{ flex: 1, padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }} />
              </div>
              <select value={origemLead} onChange={e=>setOrigemLead(e.target.value)} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <option>Instagram</option><option>Facebook</option><option>WhatsApp</option><option>Site</option>
              </select>
              <textarea placeholder="Observações..." value={notasLead} onChange={e=>setNotasLead(e.target.value)} style={{ padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', height: 80 }} />
              <button type="submit" style={{ padding: 16, background: theme.primary, color: '#fff', border: 'none', borderRadius: 12, fontWeight: 800, cursor: 'pointer', marginTop: 10 }}>SALVAR DADOS</button>
              <button type="button" onClick={()=>setView('dashboard')} style={{ background: 'none', border: 'none', color: theme.gray, fontWeight: 700 }}>CANCELAR</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
